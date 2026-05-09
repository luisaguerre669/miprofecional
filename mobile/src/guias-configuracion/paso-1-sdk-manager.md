# PASO 1: Configurar SDK Manager en Android Studio

## 1. Abrir Android Studio
- Busca "Android Studio" en el menú de Windows o haz doble clic en el escritorio
- Espera a que cargue completamente

## 2. Ir a SDK Manager
- En la barra superior, haz clic en **Tools**
- En el menú desplegable, haz clic en **SDK Manager**

```
Tools > SDK Manager
```

## 3. Configurar SDK Platforms
- Se abrirá una ventana con varias pestañas
- Haz clic en la pestaña **SDK Platforms**
- Busca **Android 14.0 (API Level 34)**
- Haz clic en la casilla para marcarlo
- Si ya tienes Android 35+ instalado, desmárcalo (no es compatible)

## 4. Configurar SDK Tools
- Haz clic en la pestaña **SDK Tools**
- Asegúrate de que estén marcadas estas casillas:
  - [x] Android SDK Build-Tools
  - [x] Android SDK Command-line Tools  
  - [x] Android SDK Platform-Tools
  - [x] Android Emulator
  - [x] Intel x86 Emulator Accelerator (HAXM installer)

## 5. Aplicar Cambios
- Haz clic en el botón **Apply** en la esquina inferior derecha
- Aparecerá una ventana de confirmación, haz clic en **OK**
- Espera a que complete la descarga e instalación

## 6. Verificar Instalación
- Una vez completado, deberías ver **Android 14.0 (API 34)** instalado
- Haz clic en **OK** para cerrar el SDK Manager

## ¿Qué buscas exactamente?
- **SDK Platforms:** Android 14.0 (API Level 34) - MARCAR
- **SDK Tools:** Android SDK Platform-Tools - MARCAR
- **Desmarcar:** Android 15.0 (API 35+) si está instalado

## Problemas Comunes:
- Si no encuentras API 34, haz clic en "Show Package Details"
- Si dice "Already installed", está bien, solo asegúrate que esté marcado
- Si pide permisos de administrador, permite la instalación

## Siguiente Paso:
Una vez completado esto, avísame para pasar al siguiente paso (Configurar JDK).
