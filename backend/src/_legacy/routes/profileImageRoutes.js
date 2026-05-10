// Profile Image Routes - Rutas para upload y gestión de imágenes de perfil
// Validación completa de formato, tamaño y almacenamiento

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const ProfileImageController = require('../controllers/profileImageController');
const { requireVerification } = require('../middleware/requireVerification');

// Middleware para logging de peticiones de imágenes de perfil
router.use((req, res, next) => {
  console.log(`📸 Profile Image API: ${req.method} ${req.path}`);
  console.log(`📸 User-Agent: ${req.get('User-Agent') || 'Unknown'}`);
  console.log(`📸 Content-Type: ${req.get('Content-Type') || 'Unknown'}`);
  console.log(`📸 Timestamp: ${new Date().toISOString()}`);
  next();
});

/**
 * Rutas de Imagen de Perfil
 */

// POST /api/profile-image/upload - Subir imagen de perfil
router.post('/upload', 
  authMiddleware, 
  requireVerification, // Solo usuarios verificados pueden subir imágenes
  ProfileImageController.uploadProfileImage
);

// DELETE /api/profile-image/delete - Eliminar imagen de perfil
router.delete('/delete', 
  authMiddleware, 
  requireVerification,
  ProfileImageController.deleteProfileImage
);

// GET /api/profile-image/info - Obtener información de la imagen actual
router.get('/info', 
  authMiddleware, 
  ProfileImageController.getProfileImageInfo
);

/**
 * Rutas de Validación (para testing y desarrollo)
 */

// POST /api/profile-image/validate - Validar imagen sin guardar (testing)
router.post('/validate', authMiddleware, async (req, res) => {
  try {
    // Usar el mismo middleware de upload pero sin guardar el archivo
    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');
    
    // Configuración temporal para validación
    const tempStorage = multer.diskStorage({
      destination: (req, file, cb) => {
        const tempPath = path.join(__dirname, '../../uploads/temp');
        if (!fs.existsSync(tempPath)) {
          fs.mkdirSync(tempPath, { recursive: true });
        }
        cb(null, tempPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'temp-' + uniqueSuffix + ext);
      }
    });
    
    const upload = multer({
      storage: tempStorage,
      fileFilter: ProfileImageController.imageFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1
      }
    });
    
    upload.single('profileImage')(req, res, async (err) => {
      if (err) {
        // Limpiar archivo temporal si existe
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (deleteError) {
            console.error('❌ Error deleting temp file:', deleteError);
          }
        }
        
        return res.status(400).json({
          success: false,
          error: err.message,
          code: err.code || 'VALIDATION_ERROR',
          message: 'La imagen no pasó la validación'
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionó ninguna imagen.',
          code: 'NO_FILE'
        });
      }
      
      // Validar imagen
      const validationResult = await ProfileImageController.validateImageFile(req.file);
      
      // Eliminar archivo temporal
      try {
        fs.unlinkSync(req.file.path);
      } catch (deleteError) {
        console.error('❌ Error deleting temp file:', deleteError);
      }
      
      res.status(200).json({
        success: true,
        data: {
          isValid: validationResult.isValid,
          error: validationResult.error,
          code: validationResult.code,
          details: validationResult.details,
          fileInfo: {
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            dimensions: validationResult.dimensions
          }
        },
        message: validationResult.isValid ? 'Imagen válida' : 'La imagen no es válida'
      });
    });
    
  } catch (error) {
    console.error('❌ Profile image validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al validar la imagen.',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * Rutas de Utilidades
 */

// GET /api/profile-image/formats - Obtener formatos permitidos
router.get('/formats', (req, res) => {
  try {
    const allowedFormats = {
      image: ['jpg', 'jpeg', 'png', 'webp'],
      mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      maxSize: '5MB',
      minSize: '10KB',
      maxDimensions: {
        width: 4000,
        height: 4000
      },
      aspectRatio: {
        recommended: '1:1 (cuadrada)',
        allowed: ['1:1', '4:3', '16:9', '3:4', '9:16']
      },
      compression: {
        recommended: 'JPEG quality 85%',
        formats: {
          'jpg': 'Buen balance calidad/tamaño',
          'png': 'Para imágenes con transparencia',
          'webp': 'Formato moderno, menor tamaño'
        }
      }
    };
    
    res.status(200).json({
      success: true,
      data: allowedFormats,
      message: 'Formatos y especificaciones permitidas'
    });
    
  } catch (error) {
    console.error('❌ Get formats error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener formatos permitidos.'
    });
  }
});

// GET /api/profile-image/stats - Estadísticas de uso (admin)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Verificar si es admin
    const userId = req.usuario.id;
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user || user.email !== 'admin@miprofesional.com') {
      return res.status(403).json({
        success: false,
        error: 'Acceso administrador requerido'
      });
    }
    
    const fs = require('fs');
    const path = require('path');
    
    // Obtener estadísticas del directorio de uploads
    const uploadDir = path.join(__dirname, '../../uploads/profile-images');
    let stats = {
      totalFiles: 0,
      totalSize: 0,
      averageSize: 0,
      formats: {},
      oldestFile: null,
      newestFile: null
    };
    
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      stats.totalFiles = files.length;
      
      let totalSize = 0;
      let oldestTime = Date.now();
      let newestTime = 0;
      
      for (const file of files) {
        const filePath = path.join(uploadDir, file);
        const fileStats = fs.statSync(filePath);
        
        totalSize += fileStats.size;
        
        const ext = path.extname(file).toLowerCase().substring(1);
        stats.formats[ext] = (stats.formats[ext] || 0) + 1;
        
        if (fileStats.mtime.getTime() < oldestTime) {
          oldestTime = fileStats.mtime.getTime();
          stats.oldestFile = file;
        }
        
        if (fileStats.mtime.getTime() > newestTime) {
          newestTime = fileStats.mtime.getTime();
          stats.newestFile = file;
        }
      }
      
      stats.totalSize = totalSize;
      stats.averageSize = files.length > 0 ? Math.round(totalSize / files.length) : 0;
      stats.oldestFile = stats.oldestFile ? new Date(oldestTime) : null;
      stats.newestFile = stats.newestFile ? new Date(newestTime) : null;
    }
    
    res.status(200).json({
      success: true,
      data: stats,
      message: 'Estadísticas de imágenes de perfil'
    });
    
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas.'
    });
  }
});

/**
 * Middleware para manejar errores
 */
router.use((error, req, res, next) => {
  console.error(`❌ Profile Image API Error: ${error.message}`);
  console.error(`❌ Path: ${req.path}`);
  console.error(`❌ Method: ${req.method}`);
  
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

/**
 * Middleware para rutas no encontradas
 */
router.use('*', (req, res) => {
  console.log(`❌ Profile Image API - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      '/upload',
      '/delete',
      '/info',
      '/validate',
      '/formats',
      '/stats'
    ]
  });
});

module.exports = router;
