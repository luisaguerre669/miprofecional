// Dead Letter Queue Processor - Failed Events Recovery
// Procesa eventos fallidos y gestiona recuperación automática

console.log("💀 DLQ Processor - Failed Events Recovery");

const fs = require('fs').promises;
const path = require('path');

class DLQProcessor {
  constructor(config = {}) {
    this.name = 'dlq-processor';
    this.isRunning = false;
    this.processedCount = 0;
    this.errorCount = 0;
    this.retryCount = 0;
    this.startTime = Date.now();
    
    // Configuración
    this.config = {
      dlqFile: config.dlqFile || path.join(process.cwd(), 'logs', 'failed-events.log'),
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 5000,
      batchSize: config.batchSize || 10,
      maxAge: config.maxAge || 24 * 60 * 60 * 1000, // 24 hours
      ...config
    };
    
    // Estado
    this.dlqEvents = [];
    this.processingQueue = [];
    this.retryTimers = new Map();
    
    this.setupGracefulShutdown();
  }

  async start() {
    try {
      console.log(`💀 [${this.name}] Starting DLQ processor...`);
      
      // Crear directorio de logs si no existe
      await this.ensureLogDirectory();
      
      // Cargar eventos existentes del archivo
      await this.loadDLQFromFile();
      
      // Iniciar procesamiento
      this.isRunning = true;
      
      // Iniciar procesamiento periódico
      this.startPeriodicProcessing();
      
      console.log(`💀 [${this.name}] Started successfully`);
      console.log(`💀 [${this.name}] Loaded ${this.dlqEvents.length} events from DLQ`);
      
      return true;
    } catch (error) {
      console.error(`💀 [${this.name}] Failed to start:`, error.message);
      return false;
    }
  }

  async stop() {
    try {
      console.log(`💀 [${this.name}] Stopping DLQ processor...`);
      
      this.isRunning = false;
      
      // Cancelar todos los timers de retry
      for (const timer of this.retryTimers.values()) {
        clearTimeout(timer);
      }
      this.retryTimers.clear();
      
      // Guardar estado actual
      await this.saveDLQToFile();
      
      console.log(`💀 [${this.name}] Stopped successfully`);
    } catch (error) {
      console.error(`💀 [${this.name}] Error during stop:`, error.message);
    }
  }

  async addFailedEvent(eventName, payload, metadata, error, broker = 'unknown') {
    try {
      const dlqEvent = {
        id: this.generateEventId(),
        eventName,
        payload,
        metadata,
        error: error.message || error,
        broker,
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        timestamp: new Date().toISOString(),
        firstFailedAt: new Date().toISOString(),
        lastRetryAt: null,
        nextRetryAt: null
      };
      
      // Agregar a DLQ
      this.dlqEvents.push(dlqEvent);
      
      // Guardar a archivo
      await this.persistDLQEvent(dlqEvent);
      
      // Programar retry si aplica
      if (dlqEvent.retryCount < dlqEvent.maxRetries) {
        this.scheduleRetry(dlqEvent);
      }
      
      console.log(`💀 [${this.name}] DLQ event stored: ${eventName} (ID: ${dlqEvent.id})`);
      
      return dlqEvent.id;
    } catch (error) {
      console.error(`💀 [${this.name}] Failed to add DLQ event:`, error.message);
      throw error;
    }
  }

  async processDLQEvent(eventId) {
    try {
      const eventIndex = this.dlqEvents.findIndex(e => e.id === eventId);
      
      if (eventIndex === -1) {
        throw new Error(`Event ${eventId} not found in DLQ`);
      }
      
      const event = this.dlqEvents[eventIndex];
      
      // Verificar si ya fue procesado
      if (event.processed) {
        console.log(`💀 [${this.name}] Event ${eventId} already processed`);
        return { success: false, reason: 'already_processed' };
      }
      
      // Verificar edad máxima
      const age = Date.now() - new Date(event.firstFailedAt).getTime();
      if (age > this.config.maxAge) {
        console.log(`💀 [${this.name}] Event ${eventId} expired (${age}ms > ${this.config.maxAge}ms)`);
        await this.markEventExpired(eventId);
        return { success: false, reason: 'expired' };
      }
      
      // Verificar límite de retries
      if (event.retryCount >= event.maxRetries) {
        console.log(`💀 [${this.name}] Event ${eventId} max retries reached (${event.retryCount}/${event.maxRetries})`);
        await this.markEventDead(eventId);
        return { success: false, reason: 'max_retries' };
      }
      
      console.log(`💀 [${this.name}] Processing DLQ event: ${event.eventName} (ID: ${eventId})`);
      
      // Intentar reprocesar el evento
      const result = await this.retryEvent(event);
      
      if (result.success) {
        // Marcar como procesado exitosamente
        await this.markEventProcessed(eventId);
        this.processedCount++;
        
        console.log(`💀 [${this.name}] DLQ event processed successfully: ${event.eventName} (ID: ${eventId})`);
        
        return { success: true, eventId, eventName: event.eventName };
      } else {
        // Incrementar retry count
        event.retryCount++;
        event.lastRetryAt = new Date().toISOString();
        
        // Programar siguiente retry
        if (event.retryCount < event.maxRetries) {
          this.scheduleRetry(event);
        } else {
          await this.markEventDead(eventId);
        }
        
        this.errorCount++;
        
        console.error(`💀 [${this.name}] DLQ event retry failed: ${event.eventName} (ID: ${eventId}) - ${result.error}`);
        
        return { success: false, eventId, eventName: event.eventName, error: result.error };
      }
      
    } catch (error) {
      console.error(`💀 [${this.name}] Error processing DLQ event ${eventId}:`, error.message);
      this.errorCount++;
      return { success: false, eventId, error: error.message };
    }
  }

  async retryEvent(event) {
    try {
      // Importar event dispatcher dinámicamente para evitar circular dependency
      const { eventDispatcher } = require('../eventDispatcher');
      
      // Reintentar publicación del evento
      const result = await eventDispatcher.emit(event.eventName, event.payload, event.metadata);
      
      return result;
    } catch (error) {
      console.error(`💀 [${this.name}] Retry failed for event ${event.id}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  scheduleRetry(event) {
    const delay = this.calculateRetryDelay(event.retryCount);
    const nextRetryAt = new Date(Date.now() + delay);
    
    event.nextRetryAt = nextRetryAt.toISOString();
    
    const timer = setTimeout(async () => {
      await this.processDLQEvent(event.id);
      this.retryTimers.delete(event.id);
    }, delay);
    
    this.retryTimers.set(event.id, timer);
    
    console.log(`💀 [${this.name}] Scheduled retry for event ${event.id} in ${delay}ms`);
  }

  calculateRetryDelay(retryCount) {
    // Exponential backoff con jitter
    const baseDelay = this.config.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * baseDelay;
    
    return Math.min(exponentialDelay + jitter, 300000); // Max 5 minutes
  }

  async markEventProcessed(eventId) {
    const eventIndex = this.dlqEvents.findIndex(e => e.id === eventId);
    
    if (eventIndex !== -1) {
      const event = this.dlqEvents[eventIndex];
      event.processed = true;
      event.processedAt = new Date().toISOString();
      
      // Actualizar archivo
      await this.updateDLQFile();
      
      // Cancelar timer si existe
      const timer = this.retryTimers.get(eventId);
      if (timer) {
        clearTimeout(timer);
        this.retryTimers.delete(eventId);
      }
    }
  }

  async markEventDead(eventId) {
    const eventIndex = this.dlqEvents.findIndex(e => e.id === eventId);
    
    if (eventIndex !== -1) {
      const event = this.dlqEvents[eventIndex];
      event.dead = true;
      event.deadAt = new Date().toISOString();
      
      // Actualizar archivo
      await this.updateDLQFile();
      
      // Cancelar timer si existe
      const timer = this.retryTimers.get(eventId);
      if (timer) {
        clearTimeout(timer);
        this.retryTimers.delete(eventId);
      }
      
      console.log(`💀 [${this.name}] Event marked as dead: ${eventId}`);
    }
  }

  async markEventExpired(eventId) {
    const eventIndex = this.dlqEvents.findIndex(e => e.id === eventId);
    
    if (eventIndex !== -1) {
      const event = this.dlqEvents[eventIndex];
      event.expired = true;
      event.expiredAt = new Date().toISOString();
      
      // Actualizar archivo
      await this.updateDLQFile();
      
      // Cancelar timer si existe
      const timer = this.retryTimers.get(eventId);
      if (timer) {
        clearTimeout(timer);
        this.retryTimers.delete(eventId);
      }
      
      console.log(`💀 [${this.name}] Event marked as expired: ${eventId}`);
    }
  }

  async processBatch() {
    try {
      if (!this.isRunning) {
        return;
      }
      
      // Obtener eventos listos para procesar
      const readyEvents = this.dlqEvents.filter(event => {
        if (event.processed || event.dead || event.expired) {
          return false;
        }
        
        if (!event.nextRetryAt) {
          return true; // Eventos nuevos
        }
        
        return new Date(event.nextRetryAt) <= new Date();
      });
      
      // Limitar a batch size
      const batch = readyEvents.slice(0, this.config.batchSize);
      
      if (batch.length === 0) {
        return;
      }
      
      console.log(`💀 [${this.name}] Processing batch of ${batch.length} events`);
      
      // Procesar eventos en paralelo
      const promises = batch.map(event => this.processDLQEvent(event.id));
      const results = await Promise.allSettled(promises);
      
      // Estadísticas del batch
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
      
      console.log(`💀 [${this.name}] Batch completed: ${successful} successful, ${failed} failed`);
      
    } catch (error) {
      console.error(`💀 [${this.name}] Batch processing error:`, error.message);
    }
  }

  startPeriodicProcessing() {
    // Procesar batch cada 30 segundos
    setInterval(() => {
      if (this.isRunning) {
        this.processBatch();
      }
    }, 30000);
    
    // Limpiar eventos expirados cada 5 minutos
    setInterval(() => {
      if (this.isRunning) {
        this.cleanupExpiredEvents();
      }
    }, 300000);
  }

  async cleanupExpiredEvents() {
    try {
      const now = Date.now();
      let cleanedCount = 0;
      
      for (let i = this.dlqEvents.length - 1; i >= 0; i--) {
        const event = this.dlqEvents[i];
        
        // Remover eventos procesados hace más de 1 hora
        if (event.processed && now - new Date(event.processedAt).getTime() > 3600000) {
          this.dlqEvents.splice(i, 1);
          cleanedCount++;
        }
        
        // Remover eventos muertos hace más de 24 horas
        if (event.dead && now - new Date(event.deadAt).getTime() > 86400000) {
          this.dlqEvents.splice(i, 1);
          cleanedCount++;
        }
        
        // Remover eventos expirados hace más de 24 horas
        if (event.expired && now - new Date(event.expiredAt).getTime() > 86400000) {
          this.dlqEvents.splice(i, 1);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        await this.updateDLQFile();
        console.log(`💀 [${this.name}] Cleaned up ${cleanedCount} old events`);
      }
      
    } catch (error) {
      console.error(`💀 [${this.name}] Cleanup error:`, error.message);
    }
  }

  async ensureLogDirectory() {
    try {
      const logDir = path.dirname(this.config.dlqFile);
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      console.error(`💀 [${this.name}] Failed to create log directory:`, error.message);
    }
  }

  async persistDLQEvent(event) {
    try {
      const logEntry = `${new Date().toISOString()} [DLQ] ${JSON.stringify(event)}\n`;
      await fs.appendFile(this.config.dlqFile, logEntry);
    } catch (error) {
      console.error(`💀 [${this.name}] Failed to persist DLQ event:`, error.message);
    }
  }

  async loadDLQFromFile() {
    try {
      const exists = await fs.access(this.config.dlqFile).then(() => true).catch(() => false);
      
      if (!exists) {
        console.log(`💀 [${this.name}] DLQ file not found, starting fresh`);
        return;
      }
      
      const content = await fs.readFile(this.config.dlqFile, 'utf8');
      const lines = content.trim().split('\n');
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            // Parsear línea: timestamp [DLQ] {event}
            const match = line.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[DLQ\] (.+)$/);
            if (match) {
              const event = JSON.parse(match[1]);
              
              // Solo cargar eventos no procesados
              if (!event.processed && !event.dead && !event.expired) {
                this.dlqEvents.push(event);
              }
            }
          } catch (parseError) {
            console.warn(`💀 [${this.name}] Failed to parse DLQ line:`, parseError.message);
          }
        }
      }
      
      console.log(`💀 [${this.name}] Loaded ${this.dlqEvents.length} active events from DLQ file`);
      
    } catch (error) {
      console.error(`💀 [${this.name}] Failed to load DLQ from file:`, error.message);
    }
  }

  async updateDLQFile() {
    try {
      // Crear nuevo archivo con eventos activos
      const activeEvents = this.dlqEvents.filter(event => 
        !event.processed && !event.dead && !event.expired
      );
      
      let content = '';
      for (const event of activeEvents) {
        content += `${new Date().toISOString()} [DLQ] ${JSON.stringify(event)}\n`;
      }
      
      await fs.writeFile(this.config.dlqFile, content);
      
    } catch (error) {
      console.error(`💀 [${this.name}] Failed to update DLQ file:`, error.message);
    }
  }

  async saveDLQToFile() {
    await this.updateDLQFile();
  }

  generateEventId() {
    return `dlq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Métodos de consulta
  getDLQStats() {
    const now = Date.now();
    const activeEvents = this.dlqEvents.filter(event => 
      !event.processed && !event.dead && !event.expired
    );
    
    const eventsByBroker = {};
    const eventsByStatus = {
      pending: 0,
      retrying: 0,
      processed: 0,
      dead: 0,
      expired: 0
    };
    
    for (const event of this.dlqEvents) {
      // Por broker
      eventsByBroker[event.broker] = (eventsByBroker[event.broker] || 0) + 1;
      
      // Por estado
      if (event.processed) {
        eventsByStatus.processed++;
      } else if (event.dead) {
        eventsByStatus.dead++;
      } else if (event.expired) {
        eventsByStatus.expired++;
      } else if (event.retryCount > 0) {
        eventsByStatus.retrying++;
      } else {
        eventsByStatus.pending++;
      }
    }
    
    return {
      total: this.dlqEvents.length,
      active: activeEvents.length,
      processed: this.processedCount,
      failed: this.errorCount,
      retryCount: this.retryCount,
      eventsByBroker,
      eventsByStatus,
      uptime: Date.now() - this.startTime,
      config: this.config,
      timestamp: new Date().toISOString()
    };
  }

  getDLQEvents(options = {}) {
    const { 
      broker, 
      status, 
      eventName, 
      limit = 100, 
      offset = 0 
    } = options;
    
    let events = [...this.dlqEvents];
    
    // Filtrar por broker
    if (broker) {
      events = events.filter(event => event.broker === broker);
    }
    
    // Filtrar por estado
    if (status) {
      events = events.filter(event => {
        switch (status) {
          case 'pending': return !event.processed && !event.dead && !event.expired && event.retryCount === 0;
          case 'retrying': return !event.processed && !event.dead && !event.expired && event.retryCount > 0;
          case 'processed': return event.processed;
          case 'dead': return event.dead;
          case 'expired': return event.expired;
          default: return true;
        }
      });
    }
    
    // Filtrar por nombre de evento
    if (eventName) {
      events = events.filter(event => event.eventName === eventName);
    }
    
    // Ordenar por timestamp (más reciente primero)
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Paginar
    events = events.slice(offset, offset + limit);
    
    return events;
  }

  // Métodos de control manual
  async retryEventManually(eventId) {
    console.log(`💀 [${this.name}] Manual retry requested for event: ${eventId}`);
    return await this.processDLQEvent(eventId);
  }

  async markEventDeadManually(eventId) {
    console.log(`💀 [${this.name}] Manual dead marking requested for event: ${eventId}`);
    await this.markEventDead(eventId);
    return { success: true, eventId };
  }

  async clearDLQ() {
    try {
      const clearedCount = this.dlqEvents.length;
      
      // Cancelar todos los timers
      for (const timer of this.retryTimers.values()) {
        clearTimeout(timer);
      }
      this.retryTimers.clear();
      
      // Limpiar memoria
      this.dlqEvents = [];
      
      // Limpiar archivo
      await fs.writeFile(this.config.dlqFile, '');
      
      console.log(`💀 [${this.name}] DLQ cleared: ${clearedCount} events removed`);
      
      return { success: true, clearedCount };
    } catch (error) {
      console.error(`💀 [${this.name}] Failed to clear DLQ:`, error.message);
      return { success: false, error: error.message };
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`💀 [${this.name}] ${signal} received, shutting down gracefully...`);
      
      await this.stop();
      
      console.log(`💀 [${this.name}] Final stats:`, this.getDLQStats());
      console.log(`💀 [${this.name}] Shutdown completed`);
      
      process.exit(0);
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }
}

// Create and start DLQ processor if this file is run directly
if (require.main === module) {
  const dlqProcessor = new DLQProcessor();
  
  dlqProcessor.start().then(success => {
    if (success) {
      console.log('💀 DLQ processor started successfully');
      
      // Periodic stats reporting
      setInterval(() => {
        console.log('💀 DLQ Processor Stats:', dlqProcessor.getDLQStats());
      }, 60000); // Every minute
    } else {
      console.error('💀 Failed to start DLQ processor');
      process.exit(1);
    }
  });
}

module.exports = {
  DLQProcessor
};
