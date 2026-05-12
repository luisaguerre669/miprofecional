/**
 * Capacitor Camera Plugin - Wrapper seguro para iOS
 * Maneja cámara y galería con permisos
 */
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isPlatform } from '@capacitor/core';

/**
 * Solicitar permisos de cámara
 */
export async function requestCameraPermissions() {
  try {
    const permissions = await Camera.requestPermissions();
    return {
      camera: permissions.camera === 'granted',
      photos: permissions.photos === 'granted'
    };
  } catch (error) {
    console.error('Error requesting camera permissions:', error);
    return { camera: false, photos: false };
  }
}

/**
 * Verificar estado de permisos
 */
export async function checkCameraPermissions() {
  try {
    const permissions = await Camera.checkPermissions();
    return {
      camera: permissions.camera === 'granted',
      photos: permissions.photos === 'granted'
    };
  } catch (error) {
    console.error('Error checking camera permissions:', error);
    return { camera: false, photos: false };
  }
}

/**
 * Tomar foto con la cámara
 */
export async function takePhoto() {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      saveToGallery: true
    });
    
    return {
      success: true,
      dataUrl: image.dataUrl,
      format: image.format
    };
  } catch (error) {
    console.error('Error taking photo:', error);
    return {
      success: false,
      error: error.message || 'Error al tomar la foto'
    };
  }
}

/**
 * Seleccionar foto de la galería
 */
export async function selectFromGallery() {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos
    });
    
    return {
      success: true,
      dataUrl: image.dataUrl,
      format: image.format
    };
  } catch (error) {
    console.error('Error selecting photo:', error);
    return {
      success: false,
      error: error.message || 'Error al seleccionar la foto'
    };
  }
}

/**
 * Subir imagen al servidor
 */
export async function uploadImage(dataUrl, endpoint = '/api/upload/image') {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://miprofesional-backend.onrender.com';
    
    // Convertir dataUrl a blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    const formData = new FormData();
    formData.append('image', blob, `photo.${blob.type.split('/')[1] || 'jpg'}`);
    
    const uploadResponse = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    
    if (!uploadResponse.ok) {
      throw new Error('Error al subir la imagen');
    }
    
    const result = await uploadResponse.json();
    return {
      success: true,
      url: result.url,
      filename: result.filename
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: error.message || 'Error al subir la imagen'
    };
  }
}

/**
 * Función completa: tomar/seleccionar y subir
 */
export async function captureAndUpload(source = 'camera') {
  // Verificar permisos
  const permissions = await checkCameraPermissions();
  
  if (source === 'camera' && !permissions.camera) {
    const newPerms = await requestCameraPermissions();
    if (!newPerms.camera) {
      return { success: false, error: 'Permiso de cámara denegado' };
    }
  }
  
  if (source === 'gallery' && !permissions.photos) {
    const newPerms = await requestCameraPermissions();
    if (!newPerms.photos) {
      return { success: false, error: 'Permiso de galería denegado' };
    }
  }
  
  // Capturar imagen
  const captureResult = source === 'camera' 
    ? await takePhoto() 
    : await selectFromGallery();
  
  if (!captureResult.success) {
    return captureResult;
  }
  
  // Subir imagen
  return await uploadImage(captureResult.dataUrl);
}
