"""
generate_icons.py
Genera los íconos PNG necesarios para la PWA de MiProfesional.
Requiere: pip install Pillow cairosvg
  o alternativamente: pip install Pillow (solo para íconos básicos)
"""
import os
import struct
import zlib

SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

def create_icon_png(size, path):
    """Genera un ícono PNG simple con gradiente azul y texto MP."""
    # PNG header + IHDR
    def make_png(w, h, pixels_rgb):
        def chunk(name, data):
            c = name + data
            return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
        
        ihdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
        
        raw = b''
        for y in range(h):
            raw += b'\x00'
            for x in range(w):
                raw += bytes(pixels_rgb[y][x])
        
        idat = chunk(b'IDAT', zlib.compress(raw))
        
        return (b'\x89PNG\r\n\x1a\n' +
                chunk(b'IHDR', ihdr) +
                idat +
                chunk(b'IEND', b''))
    
    pixels = []
    for y in range(size):
        row = []
        for x in range(size):
            # Distance from center
            cx, cy = size/2, size/2
            dx, dy = x - cx, y - cy
            dist = (dx**2 + dy**2) ** 0.5
            
            # Circular mask
            if dist > size * 0.48:
                row.append([255, 255, 255])  # white outside
                continue
            
            # Gradient: blue to darker blue
            t = y / size
            r = int(0 + t * 0)
            g = int(123 - t * 40)
            b = int(255 - t * 80)
            
            # Inner circle slightly lighter
            if dist < size * 0.35:
                g = min(255, g + 20)
                b = min(255, b + 10)
            
            # Simple "MP" text area (white rectangle in center)
            text_h = size // 6
            text_w = size // 2
            text_x = size // 2 - text_w // 2
            text_y = size // 2 - text_h // 2
            
            if text_x <= x <= text_x + text_w and text_y <= y <= text_y + text_h:
                # White area for text
                row.append([255, 255, 255])
            else:
                row.append([r, g, b])
        pixels.append(row)
    
    png_data = make_png(size, size, pixels)
    with open(path, 'wb') as f:
        f.write(png_data)

icons_dir = os.path.join(os.path.dirname(__file__), 'icons')
os.makedirs(icons_dir, exist_ok=True)

for size in SIZES:
    path = os.path.join(icons_dir, f'icon-{size}.png')
    create_icon_png(size, path)
    print(f'✅ Generado: icon-{size}.png')

print('\n✅ Todos los íconos generados correctamente.')
print('💡 Para íconos con el logo real, usa cairosvg o Inkscape para exportar favicon.svg')

<!DOCTYPE html>
<html lang="es" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
  <meta name="description" content="MiProfesional — Conecta con profesionales de confianza cerca de vos">
  <meta name="theme-color" content="#007BFF">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="MiProfesional">
  <meta name="application-name" content="MiProfesional">
  <meta name="msapplication-TileColor" content="#007BFF">

  <!-- Open Graph -->
  <meta property="og:title" content="MiProfesional">
  <meta property="og:description" content="Conecta con profesionales de confianza cerca de vos">
  <meta property="og:type" content="website">
  <meta property="og:image" content="icons/icon-512.png">

  <title>MiProfesional</title>

  <!-- PWA Manifest -->
  <link rel="manifest" href="manifest.json">

  <!-- Apple touch icons -->
  <link rel="apple-touch-icon" href="icons/icon-192.png">
  <link rel="apple-touch-icon" sizes="152x152" href="icons/icon-152.png">
  <link rel="apple-touch-icon" sizes="144x144" href="icons/icon-144.png">

  <!-- Favicon SVG -->
  <link rel="icon" type="image/svg+xml" href="icons/favicon.svg">

  <!-- Styles -->
  <link rel="stylesheet" href="css/styles.css">

  <!-- Preconnect -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
</head>
<body>
  <div id="app">
    <!-- Loading state -->
    <div style="display:flex;align-items:center;justify-content:center;height:100dvh;background:#007BFF;flex-direction:column;gap:16px;">
      <svg width="80" height="80" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="90" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
        <text x="100" y="108" font-size="80" text-anchor="middle" dominant-baseline="middle">🔧</text>
      </svg>
      <div style="color:#fff;font-size:24px;font-weight:800;font-family:system-ui">MiProfesional</div>
      <div style="color:rgba(255,255,255,0.7);font-size:14px">Cargando...</div>
    </div>
  </div>

  <!-- Scripts -->
  <script src="js/data.js"></script>
  <script src="js/auth.js"></script>
  <script src="js/chat.js"></script>
  <script src="js/admin.js"></script>
  <script src="js/app.js"></script>
  <script src="js/subscription.js"></script>

  <!-- Install PWA prompt -->
  <script>
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      // Show install button after 5s if on mobile
      setTimeout(() => {
        if (deferredPrompt && window.innerWidth < 768) {
          const banner = document.createElement('div');
          banner.id = 'install-banner';
          banner.style.cssText = 'position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:10px;z-index:3000;box-shadow:0 4px 20px rgba(0,0,0,.3);max-width:90%;';
          banner.innerHTML = `
            <span>📲</span>
            <span>Instalar MiProfesional en tu dispositivo</span>
            <button onclick="installPWA()" style="background:var(--orange);border:none;color:#fff;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">Instalar</button>
            <button onclick="document.getElementById('install-banner').remove()" style="background:none;border:none;color:rgba(255,255,255,.6);cursor:pointer;font-size:18px;padding:0 4px">✕</button>
          `;
          document.body.appendChild(banner);
        }
      }, 5000);
    });

    function installPWA() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
          deferredPrompt = null;
          document.getElementById('install-banner')?.remove();
        });
      }
    }

    window.addEventListener('appinstalled', () => {
      document.getElementById('install-banner')?.remove();
    });
  </script>
</body>
</html>

{
  "name": "MiProfesional",
  "short_name": "MiProfesional",
  "description": "Conecta clientes con profesionales de manera rapida y confiable",
  "start_url": "/index.html",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007BFF",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "icons/icon-72.png", "sizes": "72x72", "type": "image/png" },
    { "src": "icons/icon-96.png", "sizes": "96x96", "type": "image/png" },
    { "src": "icons/icon-128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "icons/icon-144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "icons/icon-152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable any" },
    { "src": "icons/icon-384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable any" }
  ],
  "categories": ["business", "productivity", "utilities"],
  "screenshots": [],
  "prefer_related_applications": false
}

# MiProfesional — Plataforma de Conexión Profesional

## Descripción
Aplicación PWA (Progressive Web App) que conecta clientes con profesionales de distintas áreas.
Funciona en Android, iOS, Windows y cualquier navegador moderno.

## Estructura del proyecto
```
miprofesional/
├── index.html          # Punto de entrada principal
├── manifest.json       # Configuración PWA
├── sw.js               # Service Worker (offline support)
├── css/
│   └── styles.css      # Estilos globales
├── js/
│   ├── data.js         # Datos y modelos
│   ├── auth.js         # Autenticación y sesión
│   ├── app.js          # Controlador principal
│   ├── chat.js         # Sistema de chat
│   ├── admin.js        # Panel administrativo
│   └── subscription.js # Sistema de suscripción
└── icons/              # Íconos PWA (72, 96, 128, 144, 152, 192, 384, 512px)
```

## Cómo ejecutar localmente

### Opción 1: Con Python (si lo instalas)
```bash
cd miprofesional
python -m http.server 8080
# Abrir: http://localhost:8080
```

### Opción 2: Con Node.js (si lo instalas)
```bash
npx serve miprofesional
```

### Opción 3: Con VS Code
Instalar extensión **Live Server** y hacer clic derecho en index.html → "Open with Live Server"

### Opción 4: Subir a hosting gratuito (recomendado para producción)
- **Netlify**: Arrastrar la carpeta `miprofesional/` a netlify.com/drop
- **Vercel**: Subir carpeta desde vercel.com
- **GitHub Pages**: Subir a repositorio GitHub y activar Pages

## Funcionalidades implementadas

### Pantallas principales
- **Splash/Login**: Registro e inicio de sesión con email, Google o WhatsApp
- **Inicio (Home)**: Categorías, búsqueda, profesionales destacados y cercanos
- **Buscar**: Filtros por categoría, estado, urgencia y radio
- **Mensajes**: Lista de chats y conversación en tiempo real
- **Perfil**: Mi perfil, disponibilidad, suscripción, historial
- **Perfil de profesional**: Info completa, galería, calificaciones, botón de chat
- **Suscripción**: Gestión del plan mensual ($10.000 ARS)
- **Panel Admin**: Estadísticas, usuarios, denuncias, suscripciones

### Características técnicas
- PWA instalable en Android/iOS/Windows
- Funciona offline (Service Worker con caché)
- Geolocalización del dispositivo
- Chat en tiempo real (simulado con respuestas automáticas)
- Sistema de calificaciones con estrellas
- Sistema de denuncias y reportes
- Selector de disponibilidad del profesional
- Filtros de urgencia (Ahora / Hoy / Esta semana)
- Panel administrativo completo
- Términos de uso con aceptación obligatoria

## Acceso de demostración
- **Admin**: admin@miprofesional.com / cualquier contraseña
- **Profesional**: cualquier email con "pro" / cualquier contraseña
- **Cliente**: cualquier otro email / cualquier contraseña

## Paleta de colores
| Color   | HEX       | Uso                        |
|---------|-----------|----------------------------|
| Azul    | #007BFF   | Botones, encabezados       |
| Verde   | #28A745   | Disponible, acentos        |
| Naranja | #FF6B00   | CTA, llamadas a la acción  |
| Gris    | #F5F5F5   | Fondos secundarios         |
| Blanco  | #FFFFFF   | Fondo principal            |

## Próximos pasos para producción

### Backend (recomendado)
- **Firebase** (gratuito hasta cierto límite):
  - Authentication: Google, email/password
  - Firestore: Base de datos en tiempo real
  - Storage: Fotos de perfil y trabajos
  - Cloud Functions: Notificaciones, suscripciones

### Pagos
- **Mercado Pago API**: Suscripciones recurrentes ($10.000/mes)
  - SDK disponible para web
  - Webhook para activar/desactivar profesionales

### Notificaciones push
- **Firebase Cloud Messaging (FCM)**: Gratis

### Publicación en tiendas
- **Android**: Usar **PWA Builder** (pwabuilder.com) para generar APK/AAB
- **iOS**: Safari en iPhone ya permite agregar a pantalla de inicio (PWA)
  - Para App Store: Se requiere cuenta Apple Developer ($99/año) y wrapper nativo
- **Windows**: Instalar desde Edge/Chrome como PWA (sin costo adicional)

### Hosting recomendado
- **Netlify** (gratis para empezar): netlify.com
- **Vercel** (gratis): vercel.com
- Ambos incluyen HTTPS automático (requerido para PWA)

## Monetización
- Primer mes GRATIS para todos los profesionales
- $10.000 ARS/mes desde el segundo mes
- Si el profesional se da de baja y vuelve → cobra al momento del alta
- Sin comisiones por trabajos realizados

const CACHE_NAME = 'miprofesional-v1.0';
const ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/data.js',
  '/js/auth.js',
  '/js/chat.js',
  '/js/admin.js',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('/index.html')))
  );
});
