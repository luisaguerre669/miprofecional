# Resumen Rápido - Configuración Android Studio

## PASO 1: SDK Manager
```
Android Studio > Tools > SDK Manager
- Marcar: Android 14.0 (API Level 34)
- Desmarcar: Android 15.0+ (no compatible)
- SDK Tools: Marcar Platform-Tools, Emulator, Build-Tools
- Apply > OK
```

## PASO 2: Configurar JDK
```
File > Settings > Build Tools > Gradle JDK
- Seleccionar: JDK 17 o JDK 18 (no 21)
- Si no está: Download JDK > JDK 17
- Apply > OK
```

## PASO 3: Variables de Entorno
```
Windows > "variables de entorno" > Variables del sistema
- Nueva: ANDROID_HOME = C:\Users\TU_NOMBRE\AppData\Local\Android\Sdk
- Editar Path: Agregar %ANDROID_HOME%\platform-tools
- Editar Path: Agregar %ANDROID_HOME%\tools
- Reiniciar PC
```

## PASO 4: Crear Emulador
```
Tools > Device Manager > Create Virtual Device
- Hardware: Pixel 6
- System: Android 14 (API 34)
- RAM: 4096 MB, Storage: 8 GB
- Name: MiProfesional_Emulator
- Finish > Play (iniciar)
```

## PASO 5: Ejecutar App
```
Terminal 1:
cd d:\proyecto_verdent\MiProfesional\mobile
npx react-native start

Terminal 2:
cd d:\proyecto_verdent\MiProfesional\mobile
npx react-native run-android
```

## Verificación:
```bash
adb version  # Debe funcionar después del paso 3
emulator -list-avds  # Debe mostrar MiProfesional_Emulator
```

## Tiempo Total: 30-45 minutos

## ¿Necesitas ayuda?
Dime en qué paso tienes problemas y te ayudaré específicamente con ese paso.
