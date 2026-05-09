// Profile Image Controller - Validación y upload de imágenes de perfil
// Controlador para validar formato, tamaño y guardar URL en profileImage

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Professional = require('../models/Professional');

class ProfileImageController {
  constructor() {
    // Configurar multer para imágenes de perfil
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/profile-images');
        
        // Crear directorio si no existe
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        // Generar nombre único con timestamp y random
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'profile-' + req.usuario.id + '-' + uniqueSuffix + ext);
      }
    });
    
    // Filtro para aceptar solo formatos válidos
    this.imageFilter = (req, file, cb) => {
      const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      
      const fileExt = path.extname(file.originalname).toLowerCase();
      
      if (!allowedMimes.includes(file.mimetype) || !allowedExtensions.includes(fileExt)) {
        const error = new Error('Formato de archivo no válido. Solo se permiten JPG, PNG y WebP');
        error.code = 'INVALID_FORMAT';
        return cb(error, false);
      }
      
      cb(null, true);
    };
    
    // Configuración de upload para imágenes de perfil
    this.uploadProfileImage = multer({
      storage: this.storage,
      fileFilter: this.imageFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
        files: 1 // Solo un archivo
      }
    });
    
    console.log('📸 Profile Image Controller initialized');
  }
  
  /**
   * Validar imagen de perfil
   */
  async uploadProfileImage(req, res) {
    try {
      const userId = req.usuario.id;
      const userType = req.usuario.userType || 'user';
      
      console.log(`📸 Uploading profile image: ${userId} (${userType})`);
      
      // Usar middleware de multer
      this.uploadProfileImage.single('profileImage')(req, res, async (err) => {
        if (err) {
          console.error('❌ Profile image upload error:', err);
          
          // Manejar diferentes tipos de errores
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              error: 'El archivo es demasiado grande. Máximo 5MB.',
              code: 'FILE_TOO_LARGE'
            });
          }
          
          if (err.code === 'INVALID_FORMAT') {
            return res.status(400).json({
              success: false,
              error: err.message,
              code: 'INVALID_FORMAT',
              allowedFormats: ['jpg', 'jpeg', 'png', 'webp']
            });
          }
          
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              error: 'Solo se permite subir una imagen a la vez.',
              code: 'TOO_MANY_FILES'
            });
          }
          
          return res.status(400).json({
            success: false,
            error: 'Error al subir la imagen.',
            code: 'UPLOAD_ERROR'
          });
        }
        
        // Verificar que se haya subido un archivo
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: 'No se proporcionó ninguna imagen.',
            code: 'NO_FILE'
          });
        }
        
        // Validaciones adicionales
        const validationResult = await this.validateImageFile(req.file);
        if (!validationResult.isValid) {
          // Eliminar archivo si no pasa validación
          try {
            fs.unlinkSync(req.file.path);
          } catch (deleteError) {
            console.error('❌ Error deleting invalid file:', deleteError);
          }
          
          return res.status(400).json({
            success: false,
            error: validationResult.error,
            code: validationResult.code,
            details: validationResult.details
          });
        }
        
        // Generar URL pública
        const imageUrl = `/uploads/profile-images/${req.file.filename}`;
        
        // Actualizar perfil del usuario
        let user;
        if (userType === 'user') {
          user = await User.findByIdAndUpdate(
            userId,
            { profileImage: imageUrl },
            { new: true }
          ).select('name email profileImage isVerified verificationStatus');
        } else if (userType === 'professional') {
          user = await Professional.findByIdAndUpdate(
            userId,
            { profileImage: imageUrl },
            { new: true }
          ).select('businessName email profileImage isVerified verificationStatus');
        }
        
        if (!user) {
          // Eliminar archivo si no se encuentra el usuario
          try {
            fs.unlinkSync(req.file.path);
          } catch (deleteError) {
            console.error('❌ Error deleting file after user not found:', deleteError);
          }
          
          return res.status(404).json({
            success: false,
            error: 'Usuario no encontrado.',
            code: 'USER_NOT_FOUND'
          });
        }
        
        res.status(200).json({
          success: true,
          data: {
            profileImage: imageUrl,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            dimensions: validationResult.dimensions,
            user: {
              id: user._id,
              name: userType === 'user' ? user.name : user.businessName,
              email: user.email,
              profileImage: user.profileImage,
              isVerified: user.isVerified,
              verificationStatus: user.verificationStatus
            }
          },
          message: 'Imagen de perfil actualizada exitosamente'
        });
      });
      
    } catch (error) {
      console.error('❌ Profile image controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al procesar la imagen de perfil.',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  /**
   * Validar archivo de imagen
   */
  async validateImageFile(file) {
    try {
      const result = {
        isValid: true,
        error: null,
        code: null,
        details: null,
        dimensions: null
      };
      
      // Validar tamaño mínimo (10KB)
      const minSize = 10 * 1024; // 10KB
      if (file.size < minSize) {
        result.isValid = false;
        result.error = 'La imagen es demasiado pequeña. Mínimo 10KB.';
        result.code = 'FILE_TOO_SMALL';
        result.details = {
          currentSize: file.size,
          minSize: minSize
        };
        return result;
      }
      
      // Validar tamaño máximo (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        result.isValid = false;
        result.error = 'La imagen es demasiado grande. Máximo 5MB.';
        result.code = 'FILE_TOO_LARGE';
        result.details = {
          currentSize: file.size,
          maxSize: maxSize
        };
        return result;
      }
      
      // Validar que el archivo no esté vacío
      if (file.size === 0) {
        result.isValid = false;
        result.error = 'El archivo está vacío.';
        result.code = 'EMPTY_FILE';
        return result;
      }
      
      // Validar extensión del archivo
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const fileExt = path.extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(fileExt)) {
        result.isValid = false;
        result.error = 'Formato de archivo no válido. Solo se permiten JPG, PNG y WebP.';
        result.code = 'INVALID_EXTENSION';
        result.details = {
          currentExtension: fileExt,
          allowedExtensions: allowedExtensions
        };
        return result;
      }
      
      // Validar MIME type
      const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimes.includes(file.mimetype)) {
        result.isValid = false;
        result.error = 'Tipo de archivo no válido. Solo se permiten imágenes.';
        result.code = 'INVALID_MIME_TYPE';
        result.details = {
          currentMime: file.mimetype,
          allowedMimes: allowedMimes
        };
        return result;
      }
      
      // Validar que el archivo sea realmente una imagen (lectura de headers)
      const isImageValid = await this.validateImageContent(file.path);
      if (!isImageValid) {
        result.isValid = false;
        result.error = 'El archivo no es una imagen válida o está corrupto.';
        result.code = 'INVALID_IMAGE_CONTENT';
        return result;
      }
      
      // Obtener dimensiones (simulado - en producción usaría sharp o similar)
      result.dimensions = await this.getImageDimensions(file.path);
      
      return result;
      
    } catch (error) {
      console.error('❌ Image validation error:', error);
      return {
        isValid: false,
        error: 'Error al validar la imagen.',
        code: 'VALIDATION_ERROR'
      };
    }
  }
  
  /**
   * Validar contenido de la imagen
   */
  async validateImageContent(filePath) {
    try {
      // Leer los primeros bytes del archivo para verificar que sea una imagen
      const buffer = fs.readFileSync(filePath);
      
      // Verificar firmas mágicas de imágenes
      const signatures = {
        'image/jpeg': [0xFF, 0xD8, 0xFF],
        'image/png': [0x89, 0x50, 0x4E, 0x47],
        'image/webp': [0x52, 0x49, 0x46, 0x46] // RIFF
      };
      
      // Verificar si coincide con alguna firma conocida
      for (const [mimeType, signature] of Object.entries(signatures)) {
        if (buffer.length >= signature.length) {
          const matches = signature.every((byte, index) => buffer[index] === byte);
          if (matches) {
            return true;
          }
        }
      }
      
      return false;
      
    } catch (error) {
      console.error('❌ Image content validation error:', error);
      return false;
    }
  }
  
  /**
   * Obtener dimensiones de la imagen (simulado)
   */
  async getImageDimensions(filePath) {
    try {
      // En una implementación real, usaría sharp o jimp
      // Por ahora, devuelve dimensiones simuladas
      return {
        width: 800,
        height: 600,
        aspectRatio: '4:3'
      };
    } catch (error) {
      console.error('❌ Get image dimensions error:', error);
      return null;
    }
  }
  
  /**
   * Eliminar imagen de perfil
   */
  async deleteProfileImage(req, res) {
    try {
      const userId = req.usuario.id;
      const userType = req.usuario.userType || 'user';
      
      console.log(`📸 Deleting profile image: ${userId} (${userType})`);
      
      // Obtener usuario actual
      let user;
      if (userType === 'user') {
        user = await User.findById(userId);
      } else if (userType === 'professional') {
        user = await Professional.findById(userId);
      }
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado.',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Eliminar archivo físico si existe
      if (user.profileImage && user.profileImage !== '') {
        try {
          const filePath = path.join(__dirname, '../../', user.profileImage);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`📸 Profile image file deleted: ${filePath}`);
          }
        } catch (deleteError) {
          console.error('❌ Error deleting profile image file:', deleteError);
          // No bloquear si no se puede eliminar el archivo
        }
      }
      
      // Limpiar URL en la base de datos
      user.profileImage = '';
      await user.save();
      
      res.status(200).json({
        success: true,
        data: {
          profileImage: '',
          user: {
            id: user._id,
            name: userType === 'user' ? user.name : user.businessName,
            email: user.email,
            profileImage: user.profileImage
          }
        },
        message: 'Imagen de perfil eliminada exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Delete profile image error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al eliminar la imagen de perfil.',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  /**
   * Obtener información de la imagen de perfil actual
   */
  async getProfileImageInfo(req, res) {
    try {
      const userId = req.usuario.id;
      const userType = req.usuario.userType || 'user';
      
      let user;
      if (userType === 'user') {
        user = await User.findById(userId).select('profileImage');
      } else if (userType === 'professional') {
        user = await Professional.findById(userId).select('profileImage');
      }
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado.',
          code: 'USER_NOT_FOUND'
        });
      }
      
      let imageInfo = {
        hasImage: false,
        profileImage: '',
        size: null,
        dimensions: null,
        format: null
      };
      
      if (user.profileImage && user.profileImage !== '') {
        const filePath = path.join(__dirname, '../../', user.profileImage);
        
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          imageInfo = {
            hasImage: true,
            profileImage: user.profileImage,
            size: stats.size,
            dimensions: await this.getImageDimensions(filePath),
            format: path.extname(user.profileImage).substring(1).toUpperCase(),
            uploadedAt: stats.mtime
          };
        }
      }
      
      res.status(200).json({
        success: true,
        data: imageInfo,
        message: 'Información de imagen de perfil obtenida'
      });
      
    } catch (error) {
      console.error('❌ Get profile image info error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener información de la imagen de perfil.',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

module.exports = new ProfileImageController();
