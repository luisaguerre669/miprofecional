# Configuración Android Studio para React Native

## PASO 1: Instalar Android Studio

1. Descargar desde: https://developer.android.com/studio
2. Instalar con configuración "Standard"
3. Reiniciar después de la instalación

## PASO 2: Configurar SDK

1. Abrir Android Studio
2. Ir a Tools > SDK Manager
3. Instalar:
   - Android 14 (API Level 34) - REQUERIDO
   - Android SDK Platform-Tools
   - Android SDK Build-Tools
   - Android Emulator
   - Intel x86 Emulator Accelerator

## PASO 3: Crear Emulador

1. Ir a Tools > Device Manager
2. Crear nuevo dispositivo:
   - Hardware: Pixel 6 o Pixel 7
   - System Image: Android 14 (API 34)
   - RAM: 4096 MB+
   - Storage: 8 GB+

## PASO 4: Variables de Entorno (Windows)

1. Buscar "Variables de entorno" en Windows
2. Click en "Variables de entorno..."
3. En "Variables del sistema":
   - Nueva variable: ANDROID_HOME
   - Valor: C:\Users\TU_NOMBRE\AppData\Local\Android\Sdk
4. Editar variable PATH:
   - Agregar: %ANDROID_HOME%\platform-tools
   - Agregar: %ANDROID_HOME%\tools
   - Agregar: %ANDROID_HOME%\tools\bin

## PASO 5: Verificar Instalación

Abrir CMD y ejecutar:
```
adb version
java -version
```

## PASO 6: Ejecutar App React Native

1. Abrir CMD en la carpeta mobile:
   ```
   cd d:\proyecto_verdent\MiProfesional\mobile
   ```

2. Iniciar Metro bundler:
   ```
   npx react-native start
   ```

3. En otra CMD, ejecutar:
   ```
   npx react-native run-android
   ```

## TROUBLESHOOTING

### Si falla "adb not found":
- Verificar que ANDROID_HOME esté configurado
- Reiniciar CMD después de configurar variables

### Si falla "gradlew not found":
- Ejecutar: `cd android && gradlew assembleDebug`

### Si falla "emulator not found":
- Abrir Android Studio
- Ir a Tools > Device Manager
- Iniciar el emulador manualmente

### Si falla "metro bundler":
- Limpiar caché: `npx react-native start --reset-cache`
- Reinstalar node_modules: `npm install`

## COMANDOS ÚTILES

```
# Limpiar proyecto
npx react-native clean

# Reinstalar dependencias
npm install --legacy-peer-deps

# Verificar emuladores
emulator -list-avds

# Iniciar emulador específico
emulator -avd NOMBRE_EMULADOR
```
