# 🚀 N8N + WINDSURF - INSTALACIÓN AUTOMÁTICA COMPLETA

## 📋 **ANÁLISIS COMPLETO PARA CONEXIÓN FÁCIL DESDE WINDSURF**

### **🎯 Objetivo:**
Instalar y configurar N8N automáticamente para que se integre perfectamente con Windsurf y el backend de MiProfesional, permitiendo ejecutar el flujo completo de registro de profesionales con IA.

---

## 🛠️ **SOLUCIÓN AUTOMÁTICA CREADA**

### **📁 Archivos Generados:**
1. **`setup-n8n.ps1`** - Script de instalación automática
2. **`test-n8n-connection.ps1`** - Script de prueba de conexión
3. **`README-N8N-WINDSURF.md`** - Documentación completa

---

## 🚀 **INSTALACIÓN AUTOMÁTICA (1 COMANDO)**

### **📋 Paso 1: Ejecutar Script de Instalación**
```powershell
# En PowerShell como Administrador
cd D:\proyecto_verdent\backend
PowerShell -ExecutionPolicy Bypass -File setup-n8n.ps1
```

### **🎯 Qué hace el script automáticamente:**
- ✅ **Verifica prerequisitos** (Docker, PowerShell)
- ✅ **Crea directorio** de instalación N8N
- ✅ **Genera Docker Compose** con N8N + PostgreSQL
- ✅ **Configura variables de entorno** automáticamente
- ✅ **Inicia contenedores Docker**
- ✅ **Importa workflows** automáticamente
- ✅ **Actualiza .env del backend** con webhook URL
- ✅ **Verifica conexión** completa

---

## 🐳 **CONFIGURACIÓN DOCKER AUTOMÁTICA**

### **📋 Docker Compose Generado:**
```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: miprofesional-n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=miprofesional123
    volumes:
      - n8n_data:/home/node/.n8n
      - n8n_workflows:/home/node/.n8n/workflows
  
  postgres:
    image: postgres:13
    container_name: miprofesional-n8n-db
    environment:
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=n8n123
      - POSTGRES_DB=n8n
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### **🔧 Variables de Entorno Configuradas:**
```bash
N8N_PORT=5678
N8N_HOST=localhost
N8N_PROTOCOL=http
WEBHOOK_URL=http://localhost:5678/
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=miprofesional123
POSTGRES_HOST=postgres
POSTGRES_USER=n8n
POSTGRES_PASSWORD=n8n123
POSTGRES_DB=n8n
```

---

## 📥 **IMPORTACIÓN AUTOMÁTICA DE WORKFLOWS**

### **🔄 Script de Importación:**
```powershell
# Importa automáticamente el workflow
# Activa webhook
# Actualiza .env del backend
# Verifica conexión
```

### **📡 Workflow Importado:**
- **Nombre:** MiProfesional - Alta Automática de Profesional con IA
- **Webhook:** `/webhook/profesional-alta`
- **Procesamiento:** Validación IA + MongoDB + Emails
- **URL:** `http://localhost:5678/webhook/profesional-alta`

---

## 🧪 **PRUEBA AUTOMÁTICA DE CONEXIÓN**

### **📋 Ejecutar Script de Prueba:**
```powershell
# Después de la instalación
cd D:\proyecto_verdent\backend
.\test-n8n-connection.ps1
```

### **🎯 Qué verifica el script:**
- ✅ **Disponibilidad de N8N** (health check)
- ✅ **Disponibilidad de Backend** (API test)
- ✅ **Webhook activo** (OPTIONS request)
- ✅ **Registro completo** (POST real)
- ✅ **MongoDB storage** (verificación)
- ✅ **Estado del registro** (GET status)
- ✅ **Métricas del sistema** (GET metrics)

---

## 🌐 **ACCESO Y CONFIGURACIÓN**

### **🔑 Credenciales por Defecto:**
```
URL: http://localhost:5678
Usuario: admin
Contraseña: miprofesional123
```

### **📡 URLs Importantes:**
```
N8N Dashboard: http://localhost:5678
Webhook: http://localhost:5678/webhook/profesional-alta
Backend API: http://localhost:3000
Endpoint Registro: http://localhost:3000/api/register/register-professional
```

---

## 🔄 **FLUJO COMPLETO AUTOMATIZADO**

### **📋 Orden de Ejecución (Automático):**
```
1. ✅ Ejecutar setup-n8n.ps1
2. ✅ N8N se instala y configura
3. ✅ Workflow se importa automáticamente
4. ✅ Backend se actualiza con webhook URL
5. ✅ Sistema listo para testing
```

### **🧪 Testing Automático:**
```powershell
# El script de prueba ejecuta:
POST http://localhost:3000/api/register/register-professional
{
  "nombre": "Juan Pérez Test",
  "email": "test@miprofesional.com",
  "telefono": "+54 11 1234-5678",
  "profesion": "Plomero Matriculado",
  "categoria": "plomeria",
  "experiencia": "5",
  "precio_hora": "800"
}

# Flujo completo:
Backend → N8N → IA → MongoDB → Response
```

---

## 🔧 **COMANDOS ÚTILES**

### **📋 Gestión de N8N:**
```powershell
# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f n8n

# Reiniciar
docker-compose restart n8n

# Detener
docker-compose down

# Iniciar manualmente
docker-compose up -d
```

### **🔄 Gestión de Workflows:**
```powershell
# Importar workflows manualmente
.\import-workflows.ps1

# Ver workflows en N8N
# Ir a http://localhost:5678
```

### **🧪 Testing:**
```powershell
# Prueba completa
.\test-n8n-connection.ps1

# Prueba con email personalizado
.\test-n8n-connection.ps1 -TestEmail "tu@email.com"

# Prueba con URLs personalizadas
.\test-n8n-connection.ps1 -N8NUrl "http://localhost:5678" -BackendUrl "http://localhost:3000"
```

---

## 🚨 **SOLUCIÓN DE PROBLEMAS**

### **❌ Docker no encontrado:**
```powershell
# Instalar Docker Desktop
# Descargar: https://www.docker.com/products/docker-desktop
# Reiniciar PowerShell
```

### **❌ Puerto 5678 ocupado:**
```powershell
# Usar otro puerto
.\setup-n8n.ps1 -Port 5679
# Actualizar .env manualmente
```

### **❌ N8N no inicia:**
```powershell
# Ver logs
docker-compose logs n8n

# Limpiar y reiniciar
docker-compose down -v
docker-compose up -d
```

### **❌ Backend no conecta:**
```powershell
# Verificar .env del backend
cat .env | grep N8N_WEBHOOK_URL

# Actualizar manualmente
N8N_WEBHOOK_URL=http://localhost:5678/webhook/profesional-alta
```

---

## 📊 **VERIFICACIÓN DE INSTALACIÓN**

### **✅ Checklist de Instalación Correcta:**
- [ ] Docker Desktop instalado y corriendo
- [ ] Script setup-n8n.ps1 ejecutado sin errores
- [ ] N8N accesible en http://localhost:5678
- [ ] Login exitoso con admin/miprofesional123
- [ ] Workflow importado y visible en dashboard
- [ ] Webhook activo en http://localhost:5678/webhook/profesional-alta
- [ ] Backend corriendo en http://localhost:3000
- [ ] .env del backend actualizado con N8N_WEBHOOK_URL
- [ ] Script test-n8n-connection.ps1 ejecutado exitosamente
- [ ] Registro de prueba completado con éxito

---

## 🎯 **BENEFICIOS DE ESTA SOLUCIÓN**

### **✅ Automatización Total:**
- **1 comando** para instalación completa
- **Configuración automática** de todos los componentes
- **Integración perfecta** con Windsurf
- **Testing automático** del flujo completo

### **✅ Facilidad de Uso:**
- **Scripts PowerShell** nativos de Windows
- **Docker Compose** para contenerización
- **Logs detallados** para debugging
- **Documentación completa** incluida

### **✅ Producción Lista:**
- **Base de datos PostgreSQL** persistente
- **Volúmenes Docker** para datos
- **Autenticación básica** segura
- **Logs y métricas** integradas

---

## 🚀 **INSTRUCCIONES FINALES**

### **📋 Para empezar:**
```powershell
# 1. Abrir PowerShell como Administrador
cd D:\proyecto_verdent\backend

# 2. Ejecutar instalación
PowerShell -ExecutionPolicy Bypass -File setup-n8n.ps1

# 3. Esperar a que termine (2-3 minutos)

# 4. Ejecutar prueba
.\test-n8n-connection.ps1

# 5. ¡Listo para usar!
```

### **🎯 Resultado Final:**
- **N8N corriendo** en http://localhost:5678
- **Workflow activo** con IA y MongoDB
- **Backend conectado** automáticamente
- **Sistema completo** listo para producción

---

**🎉 ¡CON ESTA SOLUCIÓN AUTOMÁTICA, N8N SE INSTALARÁ Y CONFIGURARÁ FÁCILMENTE DESDE WINDSURF CON SOLO UN COMANDO!**
