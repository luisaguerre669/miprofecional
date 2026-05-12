# Guía de Configuración iOS - MiProfesional

> **Estado Actual:** ✅ Estabilización completa - Listo para compilar en Xcode

## 📋 Requisitos Previos

- macOS con Xcode 15.0 o superior
- Cuenta de Apple Developer (para distribución)
- Node.js 18+ y npm instalados
- iPhone con iOS 15+ (para pruebas físicas)

## 🚀 Quick Start

### 1. Build y Sincronización (Automático)

```bash
cd D:\proyecto_verdent

# Build frontend
npm run build

# Sincronizar con iOS
npx cap sync ios
```

### 2. Abrir en Xcode

```bash
npx cap open ios
```

### 3. Configurar y Compilar

En Xcode:
1. Seleccionar proyecto "App"
2. Signing & Capabilities → Seleccionar tu Team
3. Seleccionar iPhone (simulador o físico)
4. Cmd + R para compilar

## ✅ Estado de Implementación

### Completado
- [x] Build frontend optimizado
- [x] Sincronización Capacitor iOS
- [x] Plugins nativos configurados
- [x] Permisos (cámara, galería, ubicación)
- [x] App Transport Security seguro
- [x] Almacenamiento seguro (Keychain)
- [x] Safe areas iPhone con notch
- [x] Modo oscuro automático
- [x] UX táctil optimizada
- [x] Manejo de teclado virtual
- [x] Deep links preparados
- [x] Notificaciones push preparadas

### Pendiente (Configuración en Xcode)
- [ ] Apple Developer Team
- [ ] Google Sign-In Client ID
- [ ] Push Notifications capabilities
- [ ] Pruebas en dispositivo físico
- [ ] TestFlight / App Store

## 📁 Estructura del Proyecto iOS

```
ios/
├── App/
│   ├── App/
│   │   ├── AppDelegate.swift       ← Manejo de ciclo de vida
│   │   ├── SecureStorage.swift     ← Keychain para tokens
│   │   ├── Info.plist              ← Permisos y configuración
│   │   ├── Main.storyboard         ← UI nativa
│   │   ├── LaunchScreen.storyboard ← Splash nativo
│   │   └── public/                 ← Web assets compilados
│   └── App.xcodeproj/              ← Proyecto Xcode
├── README.md                       ← Esta guía
└── ESTADO_IOS.md                   ← Estado detallado
```

## 🔧 Configuración Detallada

- ✅ **Cámara**: `NSCameraUsageDescription`
- ✅ **Galería**: `NSPhotoLibraryUsageDescription`
- ✅ **Ubicación**: `NSLocationWhenInUseUsageDescription`
- ✅ **Ubicación Background**: `NSLocationAlwaysUsageDescription`

### 3. Configuración de Google Sign-In

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear credenciales OAuth 2.0 para iOS
3. Agregar el Client ID en `Info.plist`:
   - Reemplazar `YOUR_CLIENT_ID` con tu ID real
4. En Xcode, agregar la URL Scheme:
   - Ir a "Info" → "URL Types"
   - Agregar: `com.googleusercontent.apps.TU_CLIENT_ID`

### 4. Capabilities Necesarias

Agregar en "Signing & Capabilities":

- ✅ **Push Notifications** (para notificaciones)
- ✅ **Background Modes**: 
  - Location updates
  - Remote notifications
- ✅ **App Groups** (si se usa share extension)

## 📱 Plugins Instalados

| Plugin | Uso | Versión |
|--------|-----|---------|
| `@capacitor/camera` | Cámara y galería | ^6.0.0 |
| `@capacitor/filesystem` | Archivos locales | ^6.0.0 |
| `@capacitor/preferences` | Almacenamiento local | ^6.0.0 |
| `@capacitor/share` | Compartir contenido | ^6.0.0 |
| `@capacitor/status-bar` | Barra de estado | ^6.0.0 |
| `@capacitor/splash-screen` | Pantalla de carga | ^6.0.0 |

## 🧪 Pruebas en Simulador

1. Seleccionar un simulador de iPhone
2. Presionar `Cmd + R` para compilar y ejecutar
3. Probar todas las funcionalidades:
   - ✅ Cámara (usar imagen de prueba en simulador)
   - ✅ Galería
   - ✅ Ubicación
   - ✅ Navegación
   - ✅ Login

## 📲 Pruebas en Dispositivo Físico

1. Conectar iPhone con cable
2. Seleccionar el dispositivo en Xcode
3. Confiar en el desarrollador (en iPhone):
   - Ajustes → General → VPN y Gestión de Dispositivos
   - Confiar en tu cuenta
4. Presionar `Cmd + R`

## 🚀 Publicación en App Store

### 1. Preparar App Store Connect

1. Ir a [App Store Connect](https://appstoreconnect.apple.com/)
2. Crear nueva app
3. Completar información:
   - Nombre: MiProfesional
   - SKU: com.miempresa.miprofesional
   - Bundle ID: com.miempresa.miprofesional

### 2. Archivar y Subir

1. En Xcode: Product → Archive
2. Esperar a que se genere el archivo
3. Distribute App → App Store Connect
4. Subir el build

### 3. Información Requerida

- 📸 Capturas de pantalla (iPhone 6.5", 5.5", iPad)
- 📝 Descripción de la app
- 🔍 Palabras clave
- 👤 Información de contacto
- 📋 Política de privacidad

## 🔧 Solución de Problemas

### Error: "Could not find the iOS platform"

```bash
npm install @capacitor/ios
npx cap add ios
```

### Error: "CocoaPods not installed"

```bash
sudo gem install cocoapods
```

### Error: "Signing for "App" requires a development team"

1. En Xcode, seleccionar el proyecto
2. Ir a "Signing & Capabilities"
3. Seleccionar tu Team

### Error: "Camera not working in simulator"

La cámara no funciona en simulador. Probar en dispositivo físico.

## 📚 Recursos Adicionales

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [CocoaPods Guides](https://guides.cocoapods.org/)

## ✅ Checklist Pre-Release

- [ ] Todas las funcionalidades probadas en dispositivo físico
- [ ] Permisos funcionando correctamente
- [ ] Login con Google configurado
- [ ] Iconos y splash screen correctos
- [ ] Versión y build number actualizados
- [ ] Política de privacidad publicada
- [ ] Screenshots generados
- [ ] Descripción completa en App Store Connect
