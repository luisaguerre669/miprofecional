import sharp from 'sharp';
import axios from 'axios';

// Servicio de verificación de identidad
class VerificationService {
  
  // Generar código de verificación
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Validar imagen de selfie
  async validateSelfie(imageData: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Convertir base64 a buffer
      const buffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      
      // Analizar imagen con Sharp
      const metadata = await sharp(buffer).metadata();
      
      // Validaciones básicas
      if (!metadata.width || !metadata.height) {
        return { isValid: false, error: 'No se pudo leer la imagen' };
      }
      
      if (metadata.width < 200 || metadata.height < 200) {
        return { isValid: false, error: 'La imagen es demasiado pequeña (mínimo 200x200)' };
      }
      
      if (metadata.width > 4000 || metadata.height > 4000) {
        return { isValid: false, error: 'La imagen es demasiado grande (máximo 4000x4000)' };
      }
      
      // Validar formato
      if (!['jpeg', 'jpg', 'png', 'webp'].includes(metadata.format?.toLowerCase() || '')) {
        return { isValid: false, error: 'Formato de imagen no válido. Use JPEG, PNG o WebP' };
      }
      
      // Validar tamaño del archivo (máximo 10MB)
      if (buffer.length > 10 * 1024 * 1024) {
        return { isValid: false, error: 'La imagen es demasiado pesada (máximo 10MB)' };
      }
      
      // Detección básica de rostro (simulada)
      // En producción, usarías una librería como face-api.js o un servicio de IA
      const hasFace = await this.detectFace(buffer);
      if (!hasFace) {
        return { isValid: false, error: 'No se detectó un rostro en la imagen. Por favor, tome una selfie clara' };
      }
      
      return { isValid: true };
    } catch (error) {
      console.error('Error validating selfie:', error);
      return { isValid: false, error: 'Error al validar la imagen' };
    }
  }

  // Validar imagen de matrícula
  async validateLicenseImage(imageData: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Convertir base64 a buffer
      const buffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      
      // Analizar imagen con Sharp
      const metadata = await sharp(buffer).metadata();
      
      // Validaciones básicas
      if (!metadata.width || !metadata.height) {
        return { isValid: false, error: 'No se pudo leer la imagen' };
      }
      
      if (metadata.width < 400 || metadata.height < 300) {
        return { isValid: false, error: 'La imagen es demasiado pequeña para leer la matrícula' };
      }
      
      if (metadata.width > 6000 || metadata.height > 6000) {
        return { isValid: false, error: 'La imagen es demasiado grande (máximo 6000x6000)' };
      }
      
      // Validar formato
      if (!['jpeg', 'jpg', 'png', 'webp'].includes(metadata.format?.toLowerCase() || '')) {
        return { isValid: false, error: 'Formato de imagen no válido. Use JPEG, PNG o WebP' };
      }
      
      // Validar tamaño del archivo (máximo 15MB para documentos)
      if (buffer.length > 15 * 1024 * 1024) {
        return { isValid: false, error: 'La imagen es demasiado pesada (máximo 15MB)' };
      }
      
      // OCR básico para detectar texto (simulado)
      // En producción, usarías Tesseract.js o un servicio de OCR
      const hasText = await this.detectText(buffer);
      if (!hasText) {
        return { isValid: false, error: 'No se detectó texto en la imagen. Asegúrese de que la matrícula sea legible' };
      }
      
      return { isValid: true };
    } catch (error) {
      console.error('Error validating license image:', error);
      return { isValid: false, error: 'Error al validar la imagen de matrícula' };
    }
  }

  // Detección de rostro (simulada)
  private async detectFace(buffer: Buffer): Promise<boolean> {
    try {
      // En producción, usarías face-api.js o un servicio de IA
      // Por ahora, simulamos una detección básica basada en características de la imagen
      
      const metadata = await sharp(buffer).metadata();
      
      // Validar proporciones típicas de selfie (retrato)
      if (metadata.width && metadata.height) {
        const aspectRatio = metadata.width / metadata.height;
        
        // Las selfies suelen tener proporciones verticales o cuadradas
        if (aspectRatio > 1.5) {
          return false; // Demasiado horizontal
        }
        
        // Validar que tenga resolución mínima para detectar rostro
        if (metadata.width < 300 || metadata.height < 400) {
          return false;
        }
      }
      
      // Simular detección exitosa el 85% de las veces
      return Math.random() > 0.15;
    } catch (error) {
      console.error('Error detecting face:', error);
      return false;
    }
  }

  // Detección de texto (simulada)
  private async detectText(buffer: Buffer): Promise<boolean> {
    try {
      // En producción, usarías Tesseract.js o un servicio de OCR
      // Por ahora, simulamos una detección básica
      
      const metadata = await sharp(buffer).metadata();
      
      // Validar que la imagen tenga resolución adecuada para OCR
      if (metadata.width && metadata.height) {
        if (metadata.width < 800 || metadata.height < 600) {
          return false; // Demasiado pequeña para leer texto
        }
      }
      
      // Simular detección exitosa el 90% de las veces
      return Math.random() > 0.10;
    } catch (error) {
      console.error('Error detecting text:', error);
      return false;
    }
  }

  // Verificar número de matrícula profesional
  async validateLicenseNumber(licenseNumber: string, professionType: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Limpiar y normalizar el número
      const cleanNumber = licenseNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      
      if (!cleanNumber || cleanNumber.length < 4) {
        return { isValid: false, error: 'Número de matrícula inválido' };
      }
      
      // Validar formato según el tipo de profesión
      const professionFormats = {
        'abogado': /^[A-Z]{2,4}\d{4,6}$/,
        'medico': /^[A-Z]{2,3}\d{4,6}$/,
        'contador': /^[A-Z]{2,3}\d{4,6}$/,
        'arquitecto': /^[A-Z]{2,4}\d{4,6}$/,
        'ingeniero': /^[A-Z]{2,4}\d{4,6}$/,
        'psicologo': /^[A-Z]{2,3}\d{4,6}$/,
        'default': /^[A-Z0-9]{6,12}$/
      };
      
      const format = professionFormats[professionType.toLowerCase()] || professionFormats.default;
      
      if (!format.test(cleanNumber)) {
        return { isValid: false, error: 'Formato de matrícula inválido para esta profesión' };
      }
      
      // En producción, verificarías contra una base de datos oficial
      // Por ahora, simulamos una verificación exitosa
      return { isValid: true };
    } catch (error) {
      console.error('Error validating license number:', error);
      return { isValid: false, error: 'Error al validar número de matrícula' };
    }
  }

  // Verificar fecha de vencimiento de matrícula
  validateLicenseExpiry(expiryDate: Date): { isValid: boolean; error?: string } {
    try {
      const now = new Date();
      const expiry = new Date(expiryDate);
      
      if (isNaN(expiry.getTime())) {
        return { isValid: false, error: 'Fecha de vencimiento inválida' };
      }
      
      if (expiry <= now) {
        return { isValid: false, error: 'La matrícula está vencida' };
      }
      
      // Verificar que no esté demasiado lejos en el futuro (máximo 5 años)
      const maxFuture = new Date();
      maxFuture.setFullYear(maxFuture.getFullYear() + 5);
      
      if (expiry > maxFuture) {
        return { isValid: false, error: 'Fecha de vencimiento demasiado lejana' };
      }
      
      return { isValid: true };
    } catch (error) {
      console.error('Error validating license expiry:', error);
      return { isValid: false, error: 'Error al validar fecha de vencimiento' };
    }
  }

  // Generar hash para verificar integridad de imágenes
  async generateImageHash(buffer: Buffer): Promise<string> {
    try {
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(buffer).digest('hex');
    } catch (error) {
      console.error('Error generating image hash:', error);
      throw new Error('Error al generar hash de imagen');
    }
  }

  // Comparar dos imágenes para detectar duplicados
  async compareImages(image1: string, image2: string): Promise<boolean> {
    try {
      const buffer1 = Buffer.from(image1.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const buffer2 = Buffer.from(image2.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      
      const hash1 = await this.generateImageHash(buffer1);
      const hash2 = await this.generateImageHash(buffer2);
      
      return hash1 === hash2;
    } catch (error) {
      console.error('Error comparing images:', error);
      return false;
    }
  }

  // Optimizar imagen para almacenamiento
  async optimizeImage(imageData: string, type: 'selfie' | 'license'): Promise<string> {
    try {
      const buffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      
      let optimizedBuffer: Buffer;
      
      if (type === 'selfie') {
        // Optimizar selfie: reducir a 800x800 máximo, calidad 85%
        optimizedBuffer = await sharp(buffer)
          .resize(800, 800, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ quality: 85 })
          .toBuffer();
      } else {
        // Optimizar matrícula: reducir a 1200x900 máximo, calidad 90%
        optimizedBuffer = await sharp(buffer)
          .resize(1200, 900, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ quality: 90 })
          .toBuffer();
      }
      
      return `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;
    } catch (error) {
      console.error('Error optimizing image:', error);
      return imageData; // Devolver original si falla la optimización
    }
  }

  // Verificar si una imagen es apropiada (contenido seguro)
  async checkImageContent(imageData: string): Promise<{ isAppropriate: boolean; reason?: string }> {
    try {
      // En producción, usarías un servicio de moderación de contenido
      // Por ahora, simulamos una verificación básica
      
      const buffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const metadata = await sharp(buffer).metadata();
      
      // Verificar que no sea una imagen sospechosa (demasiado grande, formato extraño, etc.)
      if (buffer.length > 20 * 1024 * 1024) {
        return { isAppropriate: false, reason: 'Archivo demasiado grande' };
      }
      
      if (!metadata.format || !['jpeg', 'jpg', 'png', 'webp'].includes(metadata.format.toLowerCase())) {
        return { isAppropriate: false, reason: 'Formato de archivo no soportado' };
      }
      
      // Simular verificación de contenido seguro (95% de aprobación)
      if (Math.random() > 0.95) {
        return { isAppropriate: false, reason: 'Contenido inapropiado detectado' };
      }
      
      return { isAppropriate: true };
    } catch (error) {
      console.error('Error checking image content:', error);
      return { isAppropriate: false, reason: 'Error al verificar contenido' };
    }
  }
}

export const verificationService = new VerificationService();
export default verificationService;
