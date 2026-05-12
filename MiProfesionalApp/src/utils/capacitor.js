import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

// Inicializar plugins de Capacitor
export const initCapacitor = async () => {
  // Configurar StatusBar
  await StatusBar.setStyle({ style: Style.Dark });
  await StatusBar.setBackgroundColor({ color: '#0a0a0a' });
  
  // Ocultar SplashScreen
  await SplashScreen.hide();
};

// Tomar foto con la cámara
export const takePhoto = async () => {
  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 90,
      allowEditing: true
    });
    return photo;
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
};

// Seleccionar foto de la galería
export const selectPhoto = async () => {
  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
      quality: 90,
      allowEditing: true
    });
    return photo;
  } catch (error) {
    console.error('Error selecting photo:', error);
    throw error;
  }
};

// Guardar datos en preferencias
export const savePreference = async (key, value) => {
  await Preferences.set({
    key,
    value: JSON.stringify(value)
  });
};

// Obtener datos de preferencias
export const getPreference = async (key) => {
  const { value } = await Preferences.get({ key });
  return value ? JSON.parse(value) : null;
};

// Eliminar preferencia
export const removePreference = async (key) => {
  await Preferences.remove({ key });
};

// Compartir contenido
export const shareContent = async (title, text, url) => {
  try {
    await Share.share({
      title,
      text,
      url,
      dialogTitle: 'Compartir'
    });
  } catch (error) {
    console.error('Error sharing:', error);
  }
};

// Guardar archivo
export const saveFile = async (filename, data) => {
  try {
    const result = await Filesystem.writeFile({
      path: filename,
      data,
      directory: Directory.Documents
    });
    return result;
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
};

// Leer archivo
export const readFile = async (filename) => {
  try {
    const result = await Filesystem.readFile({
      path: filename,
      directory: Directory.Documents
    });
    return result.data;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
};

// Verificar si estamos en iOS
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Verificar si estamos en Capacitor
export const isNative = () => {
  return typeof (window).Capacitor !== 'undefined';
};
