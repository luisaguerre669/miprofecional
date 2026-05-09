@echo off
echo ========================================
echo VERIFICACION ENTORNO REACT NATIVE
echo ========================================
echo.

echo Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado
    echo Descarga desde: https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo Verificando npm...
npm --version
if %errorlevel% neq 0 (
    echo ERROR: npm no esta instalado
    pause
    exit /b 1
)

echo.
echo Verificando ADB...
adb version
if %errorlevel% neq 0 (
    echo ERROR: ADB no esta disponible
    echo Configura Android Studio y variables de entorno
    pause
    exit /b 1
)

echo.
echo Verificando Java...
java -version
if %errorlevel% neq 0 (
    echo ERROR: Java no esta instalado
    echo Instala JDK con Android Studio
    pause
    exit /b 1
)

echo.
echo Verificando emuladores disponibles...
emulator -list-avds

echo.
echo ========================================
echo ENTORNO VERIFICADO CORRECTAMENTE!
echo ========================================
echo.
echo Ahora puedes ejecutar la app:
echo 1. npx react-native start
echo 2. npx react-native run-android
echo.
pause
