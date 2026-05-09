# PASO 4: Crear Emulador Android

## 1. Abrir Device Manager
- En Android Studio, haz clic en **Tools** (barra superior)
- Haz clic en **Device Manager**
- O haz clic en el ícono de teléfono en la barra de herramientas superior

## 2. Crear Nuevo Dispositivo
- Haz clic en el botón **"Create Virtual Device"**

## 3. Seleccionar Hardware
- En la lista de dispositivos, selecciona **Pixel 6** o **Pixel 7**
- Haz clic en **Next**

## 4. Seleccionar System Image
- Busca **Android 14.0 (API Level 34)**
- Si dice "Download" al lado, haz clic en **Download**
- Espera a que complete la descarga
- Una vez descargado, selecciónalo
- Haz clic en **Next**

## 5. Configurar AVD (Android Virtual Device)
### Configuración Recomendada:
- **AVD Name:** `MiProfesional_Emulator`
- **Advanced Settings > RAM:** `4096` MB o más
- **Advanced Settings > Internal Storage:** `8192` MB o más
- **Advanced Settings > Graphics:** `Hardware - GLES 2.0+`

## 6. Finalizar Creación
- Revisa la configuración
- Haz clic en **Finish**
- Espera a que se cree el emulador

## 7. Iniciar el Emulador
- En Device Manager, verás tu nuevo emulador
- Haz clic en el botón **Play** (triángulo verde) para iniciarlo
- Espera a que arranque (puede tardar 1-2 minutos la primera vez)

## ¿Cómo saber si funcionó?
- El emulador debería abrirse y mostrar la pantalla de inicio de Android
- Deberías ver el teléfono virtual funcionando

## Problemas Comunes:
- **"Emulator process finished with exit code"**: Revisa que tengas suficiente RAM
- **"HAXM not installed":** Instala Intel HAXM desde SDK Manager > SDK Tools
- **"Emulator is slow"**: Aumenta la RAM a 4096+ MB en Advanced Settings

## Verificación Final:
Una vez que el emulador esté funcionando, avísame para ejecutar la app.

## Comando para verificar emuladores:
```bash
emulator -list-avds
```

## Siguiente Paso:
Cuando el emulador esté corriendo, podremos ejecutar la app MiProfesional.
