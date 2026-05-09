# PASO 3: Configurar Variables de Entorno (ANDROID_HOME)

## ¿Qué son las variables de entorno?
Son configuraciones del sistema que le dicen a Windows dónde encontrar las herramientas de Android.

## 1. Abrir Variables de Entorno
- Presiona la tecla **Windows**
- Escribe: **"variables de entorno"**
- Haz clic en **"Editar las variables de entorno del sistema"**

## 2. Variables del Sistema
- En la ventana que se abre, haz clic en el botón **"Variables de entorno..."**
- En la sección **"Variables del sistema"**, haz clic en **"Nueva..."**

## 3. Crear Variable ANDROID_HOME
- **Nombre de variable:** `ANDROID_HOME`
- **Valor de variable:** `C:\Users\TU_NOMBRE\AppData\Local\Android\Sdk`

### ¿Cómo encontrar TU_NOMBRE?
- Reemplaza `TU_NOMBRE` con tu nombre de usuario de Windows
- Ejemplo: `C:\Users\Carlos\AppData\Local\Android\Sdk`
- Para encontrar tu nombre: ve a `C:\Users\` y verás tu carpeta de usuario

## 4. Editar Variable PATH
- Busca la variable **Path** en "Variables del sistema"
- Selecciónala y haz clic en **"Editar..."**
- Haz clic en **"Nueva"**
- Agrega estas dos líneas:
  - `%ANDROID_HOME%\platform-tools`
  - `%ANDROID_HOME%\tools`

## 5. Guardar Cambios
- Haz clic en **"Aceptar"** en todas las ventanas
- **IMPORTANTE:** Reinicia tu computadora

## 6. Verificar Configuración
Después de reiniciar:
- Abre una nueva ventana de CMD (Símbolo del sistema)
- Escribe: `adb version`
- Debería mostrar información de ADB

## Problemas Comunes:
- **"Ruta no encontrada"**: Verifica que la carpeta `Android\Sdk` exista
- **"Permiso denegado"**: Ejecuta como Administrador
- **"No funciona después de reiniciar"**: Verifica que escribiste bien las rutas

## ¿Cómo saber si funcionó?
- Abre CMD y escribe `adb version`
- Si muestra versión de ADB, ¡funcionó!
- Si dice "comando no encontrado", revisa las rutas

## Siguiente Paso:
Una vez que `adb version` funcione, avísame para crear el emulador.
