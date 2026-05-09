@echo off
echo Configurando entorno para React Native Android...

echo.
echo PASO 1: Verificando Node.js y npm...
node --version
npm --version

echo.
echo PASO 2: Verificando React Native CLI...
npx react-native --version

echo.
echo PASO 3: Verificando ADB...
adb version

echo.
echo PASO 4: Verificando Java...
java -version

echo.
echo PASO 5: Limpiando proyecto...
npx react-native clean

echo.
echo PASO 6: Instalando dependencias...
npm install --legacy-peer-deps

echo.
echo PASO 7: Verificando emuladores disponibles...
emulator -list-avds

echo.
echo CONFIGURACION COMPLETADA!
echo.
echo Para ejecutar la app:
echo 1. npx react-native start
echo 2. npx react-native run-android
echo.
pause
