# Configuración Android Studio para MiProfesional Mobile

## Estado Actual
- **Android Studio:** Instalado
- **Java:** OpenJDK 21.0.10 (versión demasiado alta)
- **ADB:** No configurado (variables de entorno faltantes)
- **Android SDK:** Instalado pero necesita API 34
- **Gradlew:** No encontrado

## Pasos Críticos a Realizar

### 1. Configurar SDK Manager en Android Studio
1. **Abrir Android Studio**
2. **Ir a:** Tools > SDK Manager
3. **Pestaña SDK Platforms:**
   - Instalar **Android 14.0 (API Level 34)** - REQUERIDO
   - Desinstalar SDK 35+ (no compatible con React Native)
4. **Pestaña SDK Tools:**
   - Asegurar instalados:
     - Android SDK Build-Tools
     - Android SDK Command-line Tools
     - Android SDK Platform-Tools
     - Android Emulator

### 2. Configurar Variables de Entorno
1. **Buscar:** "Variables de entorno" en Windows
2. **Hacer clic:** "Variables de entorno..."
3. **Variables del sistema > Nueva:**
   - **Nombre:** `ANDROID_HOME`
   - **Valor:** `C:\Users\TU_NOMBRE\AppData\Local\Android\Sdk`
4. **Editar variable Path:**
   - Agregar: `%ANDROID_HOME%\platform-tools`
   - Agregar: `%ANDROID_HOME%\tools`
5. **Reiniciar PC**

### 3. Crear Emulador Android
1. **Android Studio:** Tools > Device Manager
2. **"Create Virtual Device"**
3. **Hardware:** Pixel 6 o Pixel 7
4. **System Image:** Android 14 (API 34)
5. **Configuración:**
   - **AVD Name:** MiProfesional_Emulator
   - **RAM:** 4096 MB o más
   - **Storage:** 8 GB o más
   - **Graphics:** Hardware - GLES 2.0+

### 4. Verificar Configuración
Abrir CMD y ejecutar:
```bash
adb version
java -version
emulator -list-avds
```

### 5. Ejecutar App MiProfesional
```bash
# Terminal 1
cd d:\proyecto_verdent\MiProfesional\mobile
npx react-native start

# Terminal 2
cd d:\proyecto_verdent\MiProfesional\mobile
npx react-native run-android
```

## Problemas Conocidos y Soluciones

### Problema: JDK 21 no compatible
- **Causa:** React Native requiere JDK 17-20
- **Solución:** 
  1. En Android Studio: File > Settings > Build Tools > Gradle JDK
  2. Seleccionar JDK 17 o 18
  3. O descargar JDK 17 manualmente

### Problema: ADB no encontrado
- **Causa:** Variables de entorno no configuradas
- **Solución:** Configurar ANDROID_HOME y Path como se indica arriba

### Problema: Gradlew no encontrado
- **Causa:** Gradle wrapper no generado
- **Solución:** 
  ```bash
  cd android
  gradlew wrapper --gradle-version 7.5.1
  ```

## Comandos de Verificación Rápidos

```bash
# Verificar Java
java -version

# Verificar ADB (después de configurar variables)
adb version

# Verificar emuladores
emulator -list-avds

# Verificar Gradle
cd android && ./gradlew --version

# Limpiar y rebuild
npx react-native clean
npx react-native run-android
```

## Tiempo Estimado
- **Configuración SDK:** 10-15 minutos
- **Variables de entorno:** 5-10 minutos + reinicio
- **Creación emulador:** 10-15 minutos
- **Testing inicial:** 5-10 minutos
- **Total:** 30-50 minutos

## Checklist Final
- [ ] Android SDK 34 instalado
- [ ] Variables de entorno configuradas
- [ ] ADB funcionando
- [ ] Emulador creado
- [ ] App corriendo en emulador
- [ ] Todas las screens funcionando
- [ ] Assets visuales cargando correctamente
