# PASO 5: Ejecutar la App MiProfesional

## ¡Felicidades! Llegamos al paso final

Si completaste los 4 pasos anteriores, ahora podemos ejecutar la app.

## 1. Abrir Terminales
Necesitaremos 2 ventanas de CMD (Símbolo del sistema)

## 2. Terminal 1: Iniciar Metro Bundler
```bash
# Navega a la carpeta del proyecto
cd d:\proyecto_verdent\MiProfesional\mobile

# Inicia Metro bundler
npx react-native start
```

- Espera a que veas el logo de React Native
- Debería decir "Metro waiting on exp://..."
- **NO cierres esta terminal**

## 3. Terminal 2: Ejecutar en Android
```bash
# En otra ventana de CMD, navega al proyecto
cd d:\proyecto_verdent\MiProfesional\mobile

# Ejecuta la app en Android
npx react-native run-android
```

- Esto debería instalar y abrir la app en tu emulador
- La primera vez puede tardar varios minutos

## 4. ¿Qué deberías ver?
- **Metro bundler:** Terminal con logo React Native
- **Build process:** Mensajes de compilación en la segunda terminal
- **Emulador:** La app MiProfesional debería abrirse automáticamente

## 5. Explora la App
Una vez que la app esté corriendo, podrás ver:
- **Home Screen** con categorías
- **Navigation tabs** inferiores
- **7 screens funcionales**
- **Assets visuales** completos
- **Mock data** realista

## Problemas Comunes y Soluciones:

### "adb: command not found"
- Las variables de entorno no están configuradas correctamente
- Reinicia tu PC y vuelve a intentar

### "Metro bundler already running"
- Cierra la terminal de Metro y vuelve a iniciar
- O ejecuta: `npx react-native start --reset-cache`

### "Build failed"
- Revisa que JDK 17 esté configurado
- Limpia el proyecto: `npx react-native clean`

### "Emulator not running"
- Asegúrate de que el emulador esté iniciado
- Inícialo manualmente desde Device Manager

## Comandos Útiles:
```bash
# Limpiar caché
npx react-native start --reset-cache

# Limpiar proyecto
npx react-native clean

# Verificar emuladores
emulator -list-avds

# Iniciar emulador específico
emulator -avd MiProfesional_Emulator
```

## ¡Éxito!
Si todo funciona correctamente, ¡felicidades! Tienes la app MiProfesional corriendo en Android.

La app incluye:
- 7 screens completamente funcionales
- 6 componentes reutilizables
- Assets visuales completos
- Navegación fluida
- Mock data realista

## ¿Qué hacer si hay errores?
Avísame con el mensaje de error exacto y te ayudaré a solucionarlo.
