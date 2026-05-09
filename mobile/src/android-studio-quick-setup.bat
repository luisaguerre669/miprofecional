@echo off
echo ========================================
echo CONFIGURACIÓN RÁPIDA ANDROID STUDIO
echo ========================================
echo.
echo Android Studio ya está instalado. Configurando entorno...
echo.

echo PASO 1: Verificar instalación de Android Studio
echo ================================================
echo.
echo 1. Abre Android Studio
echo 2. Ve a: Tools > SDK Manager
echo 3. En "SDK Platforms", instala:
echo    - Android 14.0 (API Level 34) - REQUERIDO
echo 4. En "SDK Tools", asegurate de tener:
echo    - Android SDK Build-Tools
echo    - Android SDK Command-line Tools
echo    - Android SDK Platform-Tools
echo    - Android Emulator
echo.

echo PASO 2: Configurar variables de entorno
echo =======================================
echo.
echo 1. Busca "Variables de entorno" en Windows
echo 2. Haz clic en "Variables de entorno..."
echo 3. En "Variables del sistema", haz clic en "Nueva..."
echo 4. Agrega:
echo    Nombre: ANDROID_HOME
echo    Valor: C:\Users\TU_NOMBRE\AppData\Local\Android\Sdk
echo 5. Edita "Path" y agrega:
echo    - %ANDROID_HOME%\platform-tools
echo    - %ANDROID_HOME%\tools
echo 6. Reinicia tu PC
echo.

echo PASO 3: Crear emulador
echo =======================
echo.
echo 1. En Android Studio: Tools > Device Manager
echo 2. "Create Virtual Device"
echo 3. Selecciona: Pixel 6
echo 4. System Image: Android 14 (API 34)
echo 5. Configura:
echo    - RAM: 4096 MB+
echo    - Storage: 8 GB+
echo 6. Nombra: MiProfesional_Emulator
echo.

echo PASO 4: Verificar instalación
echo ==============================
echo.
echo Abre nueva CMD y ejecuta:
echo   adb version
echo   java -version
echo.

echo PASO 5: Ejecutar la app
echo ======================
echo.
echo 1. cd d:\proyecto_verdent\MiProfesional\mobile
echo 2. npx react-native start
echo 3. npx react-native run-android
echo.

echo ========================================
echo PRESIONA CUALQUIER TECLA PARA CONTINUAR...
pause >nul

echo.
echo VERIFICANDO INSTALACIÓN ACTUAL...
echo ================================

echo.
echo 1. Verificando Java:
java -version

echo.
echo 2. Verificando ADB:
adb version

echo.
echo 3. Verificando emuladores disponibles:
emulator -list-avds

echo.
echo ========================================
echo Si ADB funciona, puedes ejecutar la app ahora:
echo ========================================
echo.
echo 1. npx react-native start
echo 2. npx react-native run-android
echo.
pause
