# 🚀 Guía de Configuración - Workflow N8N para Alta de Profesionales

## 📋 **RESUMEN DEL WORKFLOW**

**Nombre:** MiProfesional - Alta Automática de Profesional con IA  
**Función:** Procesamiento automático de registros de profesionales con validación IA y asistencia inteligente  
**Base de datos:** MongoDB MiProfesional  

---

## 🔧 **CONFIGURACIÓN REQUERIDA**

### **1. 🌐 Webhook Configuration**
```bash
URL: https://tu-n8n-instance.com/webhook/profesional-alta
Método: POST
Content-Type: application/json
```

### **2. 🗄️ MongoDB Credentials**
```json
{
  "name": "MongoDB Atlas MiProfesional",
  "type": "mongoDb",
  "data": {
    "connectionString": "mongodb+srv://miprofesional_luis:Luisaguerre1966@miprofesional-cluster.zhkc2iq.mongodb.net/miprofesional",
    "database": "miprofesional"
  }
}
```

### **3. 📧 Email Service Credentials**
```json
{
  "name": "Email Service MiProfesional",
  "type": "smtp",
  "data": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "user": "noreply@miprofesional.com",
    "password": "tu-app-password"
  }
}
```

---

## 📝 **FORMATO DE DATOS DE ENTRADA**

### **JSON Esperado (POST al webhook):**
```json
{
  "nombre": "Juan Pérez García",
  "email": "juan.perez@email.com",
  "telefono": "+54 11 1234-5678",
  "categoria": "plomeria",
  "experiencia": "5",
  "precio_hora": "800",
  "descripcion": "Profesional con experiencia en instalaciones y reparaciones",
  "disponibilidad": "flexible",
  "ubicacion": "Capital Federal, Buenos Aires",
  "certificaciones": ["Certificado de Plomero"],
  "idiomas": ["español", "inglés"]
}
```

---

## 🤖 **INTELIGENCIA ARTIFICIAL INTEGRADA**

### **🔍 Validaciones Automáticas:**
- **Nombre:** Mínimo 3 caracteres
- **Email:** Formato válido y único
- **Teléfono:** 10-15 dígitos
- **Categoría:** Debe estar en lista permitida
- **Experiencia:** Valor numérico válido
- **Precio:** Mayor a 0

### **💡 Asistencia Inteligente:**
- **Sugerencia de precios** basados en categoría y experiencia
- **Descripciones automáticas** por categoría profesional
- **Certificaciones recomendadas** según especialidad
- **Score de calidad** (0-100) basado en completitud de datos

---

## 🔄 **FLUJO DEL WORKFLOW**

### **1. 📥 Recepción de Datos**
```
Webhook → Validación Básica → IA - Validación y Asistencia
```

### **2. 🔍 Procesamiento con IA**
```
Limpieza de datos → Validación → Sugerencias → Score de calidad
```

### **3. 🗄️ Verificación en MongoDB**
```
Verificar duplicados → ¿No existe? → ¿Es válido?
```

### **4. 💾 Almacenamiento**
```
MongoDB - Guardar Profesional → Email al profesional → Email admin
```

### **5. 📤 Respuestas**
```
Éxito: 200 con ID profesional
Error: 400 con detalles de validación
Duplicado: 409 con mensaje específico
```

---

## 📊 **ESTRUCTURA DE DATOS GUARDADA**

### **Documento MongoDB:**
```json
{
  "_id": ObjectId("..."),
  "nombre": "Juan Pérez García",
  "email": "juan.perez@email.com",
  "telefono": "541112345678",
  "categoria": "plomeria",
  "experiencia": 5,
  "precio_hora": 800,
  "descripcion": "Profesional con experiencia...",
  "disponibilidad": "flexible",
  "ubicacion": "Capital Federal, Buenos Aires",
  "certificaciones": ["Certificado de Plomero"],
  "idiomas": ["español", "inglés"],
  "validacion": {
    "esValido": true,
    "errores": [],
    "validaciones": { ... }
  },
  "sugerencias": {
    "precio_hora_sugerido": 1050,
    "descripcion_sugerida": "..."
  },
  "fecha_registro": "2026-05-04T00:00:00.000Z",
  "status": "pendiente_aprobacion",
  "score_calidad": 85
}
```

---

## 📧 **PLANTILLAS DE EMAIL**

### **👤 Email al Profesional:**
```
Asunto: ✅ Tu registro en MiProfesional ha sido recibido

¡Hola Juan Pérez!

Tu registro como profesional en MiProfesional ha sido recibido exitosamente.

📋 Estado: pendiente_aprobacion
📊 Score de Calidad: 85/100

💡 Sugerencia de precio por hora: $1050

Nos pondremos en contacto contigo pronto para completar el proceso de verificación.

¡Gracias por unirte a MiProfesional!
```

### **👨‍💼 Email al Admin:**
```
Asunto: 🆕 Nuevo Profesional Registrado - Juan Pérez

Se ha registrado un nuevo profesional en MiProfesional:

👤 Nombre: Juan Pérez García
📧 Email: juan.perez@email.com
📱 Teléfono: 541112345678
🔧 Categoría: plomeria
📊 Score de Calidad: 85/100
📋 Estado: pendiente_aprobacion

Revisar y aprobar manualmente si es necesario.

🔗 Ver detalles en el panel de administración.
```

---

## 🚨 **RESPUESTAS DE ERROR**

### **400 - Datos Inválidos:**
```json
{
  "success": false,
  "message": "Datos inválidos",
  "errors": ["nombre", "email"],
  "sugerencias": {
    "descripcion_sugerida": "...",
    "precio_hora_sugerido": 1050
  }
}
```

### **409 - Email Duplicado:**
```json
{
  "success": false,
  "message": "El profesional ya existe con este email",
  "errors": ["email_duplicado"]
}
```

---

## 🔧 **CONFIGURACIÓN EN N8N**

### **1. 📥 Importar Workflow**
1. Copiar el JSON del archivo `n8n-workflow-alta-profesional.json`
2. En N8N: "Import from file" → Pegar JSON
3. Guardar workflow

### **2. 🔑 Configurar Credenciales**
1. **MongoDB Atlas:** Crear credencial con URI de conexión
2. **SMTP:** Configurar servicio de email
3. **Webhook:** Activar y obtener URL

### **3. 🧪 Probar Workflow**
```bash
curl -X POST https://tu-n8n-instance.com/webhook/profesional-alta \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test User",
    "email": "test@example.com",
    "telefono": "1234567890",
    "categoria": "plomeria"
  }'
```

---

## 📈 **MÉTRICAS Y MONITOREO**

### **📊 Estadísticas Automáticas:**
- **Tasa de éxito** de registros
- **Score promedio** de calidad
- **Categorías más populares**
- **Errores frecuentes** de validación

### **🔍 Logs de Auditoría:**
- Timestamp de cada registro
- IP de origen
- Validaciones fallidas
- Sugerencias aplicadas

---

## 🎯 **OPTIMIZACIONES POSIBLES**

### **🚀 Mejoras Futuras:**
1. **Integración con IA real** (OpenAI/Google AI)
2. **Verificación automática** de certificaciones
3. **Geolocalización** para cobertura de servicios
4. **Integración con redes sociales** para validación
5. **Sistema de calificaciones** automático

### **📱 Extensiones Móviles:**
- **Formulario optimizado** para mobile
- **Upload de documentos** desde cámara
- **Notificaciones push** en tiempo real
- **Chat con soporte** integrado

---

## 🚨 **SEGURIDAD**

### **🔒 Medidas Implementadas:**
- **Validación de datos** estricta
- **Detección de duplicados** por email
- **Sanitización de inputs**
- **Rate limiting** en webhook
- **Logs de auditoría** completos

### **🛡️ Recomendaciones:**
- **HTTPS obligatorio** en producción
- **API Keys** rotativas
- **Backup diario** de MongoDB
- **Monitor de actividad** sospechosa

---

## 📞 **SOPORTE**

### **🔧 Troubleshooting Común:**
1. **Error de conexión MongoDB:** Verificar URI y credenciales
2. **Email no enviado:** Configurar SMTP correctamente
3. **Validación fallida:** Revisar formato de datos de entrada
4. **Webhook no responde:** Verificar que esté activo

### **📚 Documentación Adicional:**
- [MongoDB Atlas Setup](link)
- [N8N Email Configuration](link)
- [API Testing Guide](link)

---

**🎯 El workflow está listo para producción y puede ser importado directamente en N8N.**
