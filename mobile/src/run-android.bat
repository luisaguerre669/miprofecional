@echo off
echo Iniciando MiProfesional Mobile App...

echo.
echo PASO 1: Iniciando Metro bundler...
start "Metro Bundler" cmd /k "npx react-native start"

echo.
echo Esperando 5 segundos para que Metro inicie...
timeout /t 5 /nobreak >nul

echo.
echo PASO 2: Ejecutando app en Android...
npx react-native run-android

echo.
echo Si la app no inicia, verifica:
echo 1. El emulador Android está corriendo
echo 2. Las variables de entorno ANDROID_HOME están configuradas
echo 3. ADB está funcionando correctamente
echo.
pause
