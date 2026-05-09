@echo off
echo ========================================
echo CONFIGURACION ANDROID STUDIO PARA MI PROFESIONAL
echo ========================================
echo.
echo PASO 1: Descargar Android Studio
echo ================================
echo.
echo 1. Abre tu navegador web y ve a:
echo    https://developer.android.com/studio
echo.
echo 2. Haz clic en "Download Android Studio"
echo.
echo 3. Selecciona "Windows" y descarga el archivo .exe
echo.
echo 4. Una vez descargado, ejecuta el instalador
echo.
echo 5. Durante la instalacion, selecciona:
echo    - "Standard" installation
echo    - Acepta todos los componentes por defecto
echo.
echo 6. Espera a que complete la instalacion
echo.
echo ========================================
echo PRESIONA CUALQUIER TECLA PARA CONTINUAR...
pause >nul

echo.
echo PASO 2: Configurar Android SDK
echo ==============================
echo.
echo 1. Abre Android Studio
echo.
echo 2. En la pantalla de bienvenida, ve a:
echo    Tools > SDK Manager
echo.
echo 3. En la pestaña "SDK Platforms", instala:
echo    - Android 14.0 (API Level 34) - MARCAR
echo    - Android 13.0 (API Level 33) - MARCAR
echo.
echo 4. En la pestaña "SDK Tools", asegurate de tener marcado:
echo    - Android SDK Build-Tools
echo    - Android SDK Command-line Tools
echo    - Android SDK Platform-Tools
echo    - Android Emulator
echo    - Intel x86 Emulator Accelerator (HAXM installer)
echo.
echo 5. Haz clic en "Apply" y espera la instalacion
echo.
echo ========================================
echo PRESIONA CUALQUIER TECLA PARA CONTINUAR...
pause >nul

echo.
echo PASO 3: Crear Emulador Android
echo ================================
echo.
echo 1. En Android Studio, ve a:
echo    Tools > Device Manager
echo.
echo 2. Haz clic en "Create Virtual Device"
echo.
echo 3. Selecciona hardware:
echo    - Pixel 6 o Pixel 7 (recomendado)
echo.
echo 4. Selecciona System Image:
echo    - Android 14 (API Level 34)
echo    - Si no esta descargado, haz clic en "Download"
echo.
echo 5. Configuracion del emulador:
echo    - AVD Name: MiProfesional_Emulator
echo    - Advanced Settings:
echo      * RAM: 4096 MB o mas
echo      * Internal Storage: 8 GB o mas
echo      * Graphics: Hardware - GLES 2.0+
echo.
echo 6. Haz clic en "Finish"
echo.
echo ========================================
echo PRESIONA CUALQUIER TECLA PARA CONTINUAR...
pause >nul

echo.
echo PASO 4: Configurar Variables de Entorno
echo ========================================
echo.
echo 1. Busca "Variables de entorno" en el menu de Windows
echo.
echo 2. Haz clic en "Variables de entorno..."
echo.
echo 3. En "Variables del sistema", haz clic en "Nueva..."
echo.
echo 4. Agrega:
echo    Nombre de variable: ANDROID_HOME
echo    Valor de variable: C:\Users\TU_NOMBRE\AppData\Local\Android\Sdk
echo.
echo 5. Busca la variable "Path" y haz clic en "Editar..."
echo.
echo 6. Agrega estas nuevas entradas:
echo    - %ANDROID_HOME%\platform-tools
echo    - %ANDROID_HOME%\tools
echo    - %ANDROID_HOME%\tools\bin
echo.
echo 7. Haz clic en "Aceptar" en todas las ventanas
echo.
echo 8. REINICIA tu computadora
echo.
echo ========================================
echo PRESIONA CUALQUIER TECLA PARA CONTINUAR...
pause >nul

echo.
echo PASO 5: Verificar Instalacion
echo ==============================
echo.
echo 1. Abre una nueva ventana de CMD
echo.
echo 2. Ejecuta estos comandos para verificar:
echo.
echo    node --version
echo    adb version
echo    java -version
echo.
echo 3. Si todos funcionan, la configuracion esta lista!
echo.
echo ========================================
echo PRESIONA CUALQUIER TECLA PARA EJECUTAR VERIFICACION...
pause >nul

echo.
echo VERIFICANDO INSTALACION...
echo ==========================
echo.
echo Node.js:
node --version

echo.
echo ADB:
adb version

echo.
echo Java:
java -version

echo.
echo ========================================
echo CONFIGURACION COMPLETADA!
echo ========================================
echo.
echo Ahora puedes ejecutar la app MiProfesional:
echo.
echo 1. Abre CMD en la carpeta mobile:
echo    cd d:\proyecto_verdent\MiProfesional\mobile
echo.
echo 2. Inicia Metro bundler:
echo    npx react-native start
echo.
echo 3. En otra CMD, ejecuta:
echo    npx react-native run-android
echo.
echo.
pause
