# 🔧 Guía de Configuración MongoDB Atlas

Esta guía te ayudará a resolver el error **"bad auth"** y configurar correctamente la conexión con MongoDB Atlas.

---

## 🚨 Error "bad auth" - Causas y Soluciones

### Causa 1: Contraseña con caracteres especiales
Si tu contraseña contiene caracteres especiales (`@`, `#`, `$`, `%`, `&`, `+`, `=`, `?`), deben estar **URL-encoded** en la URI.

**Ejemplo:**
```bash
# ❌ INCORRECTO (error bad auth)
MONGODB_URI=mongodb+srv://user:MyP@ssw0rd!@cluster0.xxxxx.mongodb.net/miprofesional

# ✅ CORRECTO (contraseña codificada)
MONGODB_URI=mongodb+srv://user:MyP%40ssw0rd%21@cluster0.xxxxx.mongodb.net/miprofesional
```

### Tabla de codificación de caracteres especiales:

| Carácter | Codificación |
|----------|--------------|
| `@` | `%40` |
| `#` | `%23` |
| `$` | `%24` |
| `%` | `%25` |
| `&` | `%26` |
| `+` | `%2B` |
| `=` | `%3D` |
| `?` | `%3F` |
| `/` | `%2F` |
| `:` | `%3A` |

---

## 📋 Pasos para configurar MongoDB Atlas

### Paso 1: Crear cuenta y cluster

1. Ve a [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Crea una cuenta (puedes usar Google)
3. Crea un nuevo cluster:
   - Selecciona **M0 (FREE)** para empezar
   - Elige la región más cercana a tus usuarios
   - Nombre del cluster: `Cluster0` (o el que prefieras)
4. Espera ~3 minutos a que se cree el cluster

### Paso 2: Crear usuario de base de datos

1. En el panel izquierdo, haz click en **"Database Access"**
2. Click en **"Add New Database User"**
3. Selecciona **"Password"** como método de autenticación
4. Crea un usuario:
   - **Username:** `miprofesional_user` (o el que prefieras)
   - **Password:** Genera una segura o escribe la tuya
   - **IMPORTANTE:** Si pones caracteres especiales, recuerda codificarlos
5. En **"Database User Privileges"**, selecciona **"Read and write to any database"**
6. Click en **"Add User"**

### Paso 3: Configurar acceso de red (IP Whitelist)

1. En el panel izquierdo, haz click en **"Network Access"**
2. Click en **"Add IP Address"**
3. Para desarrollo, selecciona **"Allow Access from Anywhere"** (añade `0.0.0.0/0`)
   - ⚠️ **Nota:** En producción, usa IPs específicas
4. Click en **"Confirm"**

### Paso 4: Obtener la URI de conexión

1. Ve a **"Clusters"** y haz click en **"Connect"**
2. Selecciona **"Connect your application"**
3. Selecciona **"Node.js"** y versión **"4.1 or later"**
4. Copia la URI que aparece

**Ejemplo de URI:**
```
mongodb+srv://miprofesional_user:<password>@cluster0.abc123.mongodb.net/miprofesional?retryWrites=true&w=majority
```

5. Reemplaza `<password>` con tu contraseña (codificada si tiene caracteres especiales)

### Paso 5: Configurar el archivo .env

1. Copia el archivo de ejemplo:
   ```bash
   cd backend
   copy .env.example .env
   ```

2. Edita el archivo `.env` y añade tu URI:
   ```env
   MONGODB_URI=mongodb+srv://miprofesional_user:TU_PASSWORD@cluster0.abc123.mongodb.net/miprofesional?retryWrites=true&w=majority
   ```

---

## 🛠️ Usar el script de configuración automática

Hemos creado un script interactivo para ayudarte:

```bash
cd backend
node scripts/mongodb-atlas-setup.js
```

Este script te permitirá:
- ✅ Probar tu conexión actual
- ✅ Configurar una nueva conexión paso a paso
- ✅ Verificar y reparar problemas comunes
- ✅ Guardar la configuración automáticamente

---

## ✅ Verificar la conexión

### Método 1: Iniciar el servidor
```bash
cd backend
npm start
```

Si ves:
```
🔌 Conectando a MongoDB...
   Tipo: 🌐 MongoDB Atlas
   URI: mongodb+srv://***:***@cluster0...
✅ MongoDB conectado correctamente
   Database: miprofesional
   Host: cluster0-shard-00-00.xxxxx.mongodb.net
```

¡La conexión está funcionando! 🎉

### Método 2: Health check endpoint
```bash
curl http://localhost:3000/health
```

---

## 🔍 Diagnóstico de problemas comunes

### Error: "bad auth: Authentication failed"
```
Causa: Usuario o contraseña incorrectos
Solución:
1. Verifica en Database Access que el usuario exista
2. Asegúrate de que la contraseña esté correcta
3. Si tiene caracteres especiales, codifícalos (@ → %40)
```

### Error: "IP is not in the whitelist"
```
Causa: Tu IP no está permitida
Solución:
1. Ve a Network Access en MongoDB Atlas
2. Añade tu IP actual o usa 0.0.0.0/0
```

### Error: "getaddrinfo ENOTFOUND"
```
Causa: El nombre del cluster es incorrecto
Solución:
1. Verifica el nombre del cluster en Atlas
2. Ejemplo correcto: cluster0.abc123.mongodb.net
```

### Error: "connection timed out"
```
Causa: Problemas de red o firewall
Solución:
1. Verifica tu conexión a internet
2. Desactiva temporalmente el firewall/antivirus
3. Intenta desde otra red
```

---

## 📁 Estructura de archivos relevantes

```
backend/
├── .env                          # Tu configuración (no commitear)
├── .env.example                  # Ejemplo de configuración
├── scripts/
│   └── mongodb-atlas-setup.js   # Script de ayuda
└── src/
    └── config/
        ├── database.js          # Configuración principal
        └── db.js                # Configuración alternativa
```

---

## 🔐 Seguridad recomendada

### Para Desarrollo:
- ✅ Usa M0 (gratis) de MongoDB Atlas
- ✅ IP whitelist: `0.0.0.0/0` (acceso desde cualquier lugar)
- ✅ Contraseña fuerte con caracteres especiales

### Para Producción:
- ✅ Usa M10 o superior (pago)
- ✅ IP whitelist: Solo IPs de tus servidores
- ✅ Habilita 2FA en tu cuenta de MongoDB Atlas
- ✅ Usa VPC peering si es posible
- ✅ Habilita encryption at rest
- ✅ Configura backups automáticos

---

## 💡 Consejos útiles

1. **Nunca commitees el archivo `.env`** - Añádelo a `.gitignore`

2. **Usa variables diferentes para desarrollo y producción:**
   ```env
   # .env.development
   MONGODB_URI=mongodb://localhost:27017/miprofesional
   
   # .env.production
   MONGODB_URI=mongodb+srv://user:pass@cluster0...
   ```

3. **Para codificar la contraseña automáticamente:**
   ```javascript
   const encodedPassword = encodeURIComponent('MyP@ssw0rd!');
   console.log(encodedPassword); // MyP%40ssw0rd%21
   ```

4. **Verifica tu URI con MongoDB Compass** antes de usarla en la app

---

## 📚 Recursos adicionales

- [Documentación MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [Connection String URI Format](https://docs.mongodb.com/manual/reference/connection-string/)
- [MongoDB Node.js Driver](https://docs.mongodb.com/drivers/node/)
- [MongoDB Compass - GUI](https://www.mongodb.com/products/compass)

---

## 🆘 Soporte

Si sigues teniendo problemas:

1. Ejecuta el script de diagnóstico:
   ```bash
   node scripts/mongodb-atlas-setup.js
   ```

2. Verifica los logs del servidor:
   ```bash
   npm start 2>&1 | tee server.log
   ```

3. Revisa la consola de MongoDB Atlas para errores

4. Contacta al equipo de soporte de MongoDB Atlas
