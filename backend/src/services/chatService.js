// Chat Service - Sistema de chat en tiempo real
// Implementación de chat entre usuarios y profesionales

const Message = require('../models/Message');
const User = require('../models/User');
const Professional = require('../models/Professional');
const jwt = require('jsonwebtoken');

class ChatService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socket.id
    this.connectedProfessionals = new Map(); // professionalId -> socket.id
    this.activeChats = new Map(); // chatId -> Set of userIds
    console.log('💬 Chat Service initialized');
  }

  /**
   * Inicializar el servicio de chat con Socket.IO
   */
  initializeChat(io) {
    this.io = io;
    
    // Middleware de autenticación para Socket.IO
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token required'));
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        socket.userId = decoded.id;
        socket.userType = decoded.userType; // 'user' or 'professional'
        socket.userData = decoded;
        
        console.log(`💬 User authenticated: ${decoded.userType} - ${decoded.id}`);
        next();
      } catch (error) {
        console.error('💬 Authentication error:', error.message);
        next(new Error('Invalid authentication token'));
      }
    });
    
    // Evento de conexión
    this.io.on('connection', (socket) => {
      console.log(`💬 User connected: ${socket.userId} (${socket.userType})`);
      
      // Registrar usuario como conectado
      if (socket.userType === 'user') {
        this.connectedUsers.set(socket.userId, socket.id);
      } else if (socket.userType === 'professional') {
        this.connectedProfessionals.set(socket.userId, socket.id);
      }
      
      // Unir a salas específicas
      socket.join(`user_${socket.userId}`);
      socket.join(`${socket.userType}_${socket.userId}`);
      
      // Enviar lista de usuarios conectados
      this.sendConnectedUsersList();
      
      // Eventos del socket
      this.setupSocketEvents(socket);
    });
    
    // Evento de desconexión
    this.io.on('disconnect', (socket) => {
      console.log(`💬 User disconnected: ${socket.userId} (${socket.userType})`);
      
      // Remover de usuarios conectados
      if (socket.userType === 'user') {
        this.connectedUsers.delete(socket.userId);
      } else if (socket.userType === 'professional') {
        this.connectedProfessionals.delete(socket.userId);
      }
      
      // Salir de las salas
      socket.leave(`user_${socket.userId}`);
      socket.leave(`${socket.userType}_${socket.userId}`);
      
      // Enviar lista actualizada
      this.sendConnectedUsersList();
    });
    
    console.log('💬 Chat service initialized successfully');
  }

  /**
   * Configurar eventos del socket para chat
   */
  setupSocketEvents(socket) {
    // Enviar mensaje
    socket.on('send_message', async (data) => {
      try {
        const { recipientId, message, chatId } = data;
        
        console.log(`💬 Message from ${socket.userId} to ${recipientId}: ${message.substring(0, 50)}...`);
        
        // Validar datos
        if (!recipientId || !message) {
          socket.emit('error', { message: 'Recipient and message are required' });
          return;
        }
        
        // Crear mensaje en base de datos
        const newMessage = new Message({
          sender: socket.userId,
          senderType: socket.userType,
          recipient: recipientId,
          recipientType: socket.userType === 'user' ? 'professional' : 'user',
          message: message.trim(),
          chatId: chatId || this.generateChatId(socket.userId, recipientId),
          status: 'sent',
          timestamp: new Date()
        });
        
        await newMessage.save();
        
        // Obtener información del remitente
        const senderInfo = await this.getUserInfo(socket.userId, socket.userType);
        
        // Enviar mensaje al destinatario
        const recipientSocketId = this.getRecipientSocketId(recipientId, socket.userType === 'user' ? 'professional' : 'user');
        
        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit('new_message', {
            id: newMessage._id,
            chatId: newMessage.chatId,
            sender: senderInfo,
            message: newMessage.message,
            timestamp: newMessage.timestamp,
            status: 'delivered'
          });
          
          // Confirmar entrega al remitente
          socket.emit('message_delivered', {
            messageId: newMessage._id,
            timestamp: new Date()
          });
          
          console.log(`💬 Message delivered to ${recipientId}`);
        } else {
          // Destinatario no conectado, marcar como pendiente
          socket.emit('message_pending', {
            messageId: newMessage._id,
            recipientId,
            timestamp: new Date()
          });
          
          console.log(`💬 Message pending for ${recipientId} (not connected)`);
        }
        
      } catch (error) {
        console.error('💬 Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Marcar mensaje como leído
    socket.on('mark_message_read', async (data) => {
      try {
        const { messageId } = data;
        
        await Message.findByIdAndUpdate(messageId, {
          status: 'read',
          readAt: new Date()
        });
        
        // Notificar al remitente que fue leído
        const message = await Message.findById(messageId).populate('sender');
        
        const senderSocketId = this.getRecipientSocketId(message.sender._id, message.senderType);
        
        if (senderSocketId) {
          this.io.to(senderSocketId).emit('message_read', {
            messageId: messageId,
            readAt: new Date()
          });
        }
        
      } catch (error) {
        console.error('💬 Error marking message as read:', error);
      }
    });
    
    // Obtener historial de chat
    socket.on('get_chat_history', async (data) => {
      try {
        const { recipientId, limit = 50, skip = 0 } = data;
        
        const chatId = this.generateChatId(socket.userId, recipientId);
        
        const messages = await Message.find({
          chatId: chatId,
          $or: [
            { sender: socket.userId, recipient: recipientId },
            { sender: recipientId, recipient: socket.userId }
          ]
        })
        .populate('sender', 'name profileImage')
        .populate('recipient', 'name profileImage')
        .sort({ timestamp: 1 })
        .skip(skip)
        .limit(limit)
        .lean();
        
        socket.emit('chat_history', {
          chatId,
          messages,
          hasMore: messages.length === limit
        });
        
      } catch (error) {
        console.error('💬 Error getting chat history:', error);
        socket.emit('error', { message: 'Failed to get chat history' });
      }
    });
    
    // Obtener lista de chats
    socket.on('get_chat_list', async () => {
      try {
        const chats = await Message.aggregate([
          {
            $match: {
              $or: [
                { sender: socket.userId },
                { recipient: socket.userId }
              ]
            }
          },
          {
            $group: {
              _id: '$chatId',
              lastMessage: { $last: '$$ROOT' },
              unreadCount: {
                $sum: {
                  $cond: [
                    { if: { $eq: ['$recipient', socket.userId] }, then: 1 },
                    { if: { $ne: ['$recipient', socket.userId] }, then: 0 }
                  ]
                }
              },
              participant: {
                $first: {
                  $cond: [
                    { if: { $eq: ['$sender', socket.userId] }, then: '$recipient' },
                    { if: { $ne: ['$sender', socket.userId] }, then: '$sender' }
                  ]
                }
              }
            }
          },
          {
            $sort: { lastMessage: -1 }
          }
        ]);
        
        // Poblar información de participantes
        const populatedChats = await Promise.all(
          chats.map(async (chat) => {
            const participantInfo = await this.getUserInfo(chat.participant, 'user');
            return {
              chatId: chat._id,
              lastMessage: chat.lastMessage,
              unreadCount: chat.unreadCount,
              participant: participantInfo
            };
          })
        );
        
        socket.emit('chat_list', populatedChats);
        
      } catch (error) {
        console.error('💬 Error getting chat list:', error);
        socket.emit('error', { message: 'Failed to get chat list' });
      }
    });
    
    // Escribiendo indicador
    socket.on('typing_start', (data) => {
      const { recipientId } = data;
      const recipientSocketId = this.getRecipientSocketId(recipientId, socket.userType === 'user' ? 'professional' : 'user');
      
      if (recipientSocketId) {
        this.io.to(recipientSocketId).emit('user_typing', {
          userId: socket.userId,
          userName: socket.userData.name,
          isTyping: true
        });
      }
    });
    
    socket.on('typing_stop', (data) => {
      const { recipientId } = data;
      const recipientSocketId = this.getRecipientSocketId(recipientId, socket.userType === 'user' ? 'professional' : 'user');
      
      if (recipientSocketId) {
        this.io.to(recipientSocketId).emit('user_typing', {
          userId: socket.userId,
          isTyping: false
        });
      }
    });
  }

  /**
   * Generar ID único para chat
   */
  generateChatId(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
  }

  /**
   * Obtener información de usuario
   */
  async getUserInfo(userId, userType) {
    try {
      let user;
      
      if (userType === 'user') {
        user = await User.findById(userId).select('name profileImage').lean();
      } else if (userType === 'professional') {
        user = await Professional.findById(userId).select('businessName profileImage').lean();
      }
      
      return {
        id: userId,
        type: userType,
        name: user?.name || user?.businessName || 'Unknown',
        profileImage: user?.profileImage || ''
      };
    } catch (error) {
      console.error('💬 Error getting user info:', error);
      return {
        id: userId,
        type: userType,
        name: 'Unknown',
        profileImage: ''
      };
    }
  }

  /**
   * Obtener socket ID del destinatario
   */
  getRecipientSocketId(recipientId, recipientType) {
    if (recipientType === 'user') {
      return this.connectedUsers.get(recipientId);
    } else if (recipientType === 'professional') {
      return this.connectedProfessionals.get(recipientId);
    }
    return null;
  }

  /**
   * Enviar lista de usuarios conectados
   */
  sendConnectedUsersList() {
    const connectedUsers = {
      users: Array.from(this.connectedUsers.entries()).map(([userId, socketId]) => ({
        userId,
        socketId,
        type: 'user'
      })),
      professionals: Array.from(this.connectedProfessionals.entries()).map(([professionalId, socketId]) => ({
        professionalId,
        socketId,
        type: 'professional'
      }))
    };
    
    this.io.emit('connected_users', connectedUsers);
  }

  /**
   * Enviar notificación de nuevo mensaje
   */
  async sendNotification(recipientId, message) {
    try {
      // Aquí se integraría con el servicio de notificaciones push
      console.log(`🔔 Push notification sent to ${recipientId}: ${message.substring(0, 50)}...`);
      
      // Mock de notificación push
      return { success: true, message: 'Notification sent' };
    } catch (error) {
      console.error('🔔 Error sending notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener estadísticas del chat
   */
  async getChatStats() {
    try {
      const [totalMessages, activeChats, unreadMessages] = await Promise.all([
        Message.countDocuments(),
        Message.distinct('chatId').countDocuments(),
        Message.countDocuments({ status: 'sent', readAt: { $exists: false } })
      ]);
      
      return {
        totalMessages,
        activeChats,
        unreadMessages,
        connectedUsers: this.connectedUsers.size,
        connectedProfessionals: this.connectedProfessionals.size,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('💬 Error getting chat stats:', error);
      return {
        totalMessages: 0,
        activeChats: 0,
        unreadMessages: 0,
        connectedUsers: 0,
        connectedProfessionals: 0,
        error: error.message
      };
    }
  }
}

module.exports = ChatService;
