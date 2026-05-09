# PASO 2: Configurar JDK (Java Development Kit)

## Problema Actual
Tienes JDK 21.0.10 instalado, pero React Native necesita JDK 17-20.

## Solución 1: Usar JDK integrado de Android Studio (Recomendado)

### 1. Ir a Settings
- En Android Studio, haz clic en **File** (barra superior)
- Haz clic en **Settings...**

### 2. Navegar a Build Tools
- En el panel izquierdo, busca y haz clic en **Build, Execution, Deployment**
- Haz clic en **Build Tools**
- Haz clic en **Gradle JDK**

### 3. Seleccionar JDK compatible
- En el menú desplegable, busca y selecciona:
  - **JDK 17** (si está disponible) O
  - **JDK 18** (si está disponible) O
  - **Download JDK** > **JDK 17** (si no está instalado)

### 4. Aplicar y Guardar
- Haz clic en **Apply** o **OK**
- Espera a que Android Studio configure el JDK

## Solución 2: Descargar JDK 17 Manualmente

Si no encuentras JDK 17 en Android Studio:

### 1. Descargar JDK 17
- Ve a: https://adoptium.net/temurin/releases/?version=17
- Descarga la versión para **Windows x64** (archivo .msi)
- Ejecuta el instalador

### 2. Configurar en Android Studio
- Repite los pasos 1-2 de la Solución 1
- En Gradle JDK, selecciona **Add JDK...**
- Navega a donde instalaste JDK 17 (usualmente `C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x`)
- Selecciona la carpeta y haz clic en **OK**

## ¿Cómo saber si funcionó?
- En Settings > Build Tools > Gradle JDK, deberías ver **JDK 17** seleccionado
- Si no, intenta reiniciar Android Studio

## Problemas Comunes:
- **"JDK not found"**: Reinicia Android Studio después de instalar JDK 17
- **"Build failed"**: Asegúrate de haber seleccionado JDK 17, no 21
- **"Permission denied"**: Ejecuta Android Studio como Administrador

## Verificación:
Una vez configurado, haz clic en **OK** para cerrar Settings y avísame para pasar al siguiente paso.
