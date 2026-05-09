// Upload Controller - Sistema de upload de imágenes y archivos
// Controlador para gestionar carga de archivos, imágenes y documentos

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Professional = require('../models/Professional');

class UploadController {
  constructor() {
    // Configurar multer para uploads
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
        
        // Crear directorio si no existe
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        // Crear subdirectorios por tipo
        const typeDir = req.uploadType || 'general';
        const typePath = path.join(uploadPath, typeDir);
        
        if (!fs.existsSync(typePath)) {
          fs.mkdirSync(typePath, { recursive: true });
        }
        
        cb(null, typePath);
      },
      filename: (req, file, cb) => {
        // Generar nombre único
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
      }
    });
    
    // Filtros para tipos de archivo
    this.imageFilter = (req, file, cb) => {
      const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)'), false);
      }
    };
    
    this.documentFilter = (req, file, cb) => {
      const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten documentos (PDF, Word, Excel)'), false);
      }
    };
    
    // Configuración de upload
    this.uploadImage = multer({
      storage: this.storage,
      fileFilter: this.imageFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 5
      }
    });
    
    this.uploadDocument = multer({
      storage: this.storage,
      fileFilter: this.documentFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 3
      }
    });
    
    console.log('📸 Upload Controller initialized');
  }

  /**
   * Subir imagen de perfil
   */
  async uploadProfileImage(req, res) {
    try {
      req.uploadType = 'profiles';
      
      this.uploadImage.single('image')(req, res, async (err) => {
        if (err) {
          console.error('❌ Profile image upload error:', err);
          return res.status(400).json({
            success: false,
            error: err.message
          });
        }
        
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: 'No se proporcionó ninguna imagen'
          });
        }
        
        const userId = req.usuario.id;
        const userType = req.usuario.userType || 'user';
        
        console.log(`📸 Uploading profile image: ${userId} (${userType})`);
        
        // Generar URL pública
        const imageUrl = `/uploads/profiles/${req.file.filename}`;
        
        // Actualizar perfil del usuario
        let user;
        if (userType === 'user') {
          user = await User.findByIdAndUpdate(
            userId,
            { profileImage: imageUrl },
            { new: true }
          );
        } else if (userType === 'professional') {
          user = await Professional.findByIdAndUpdate(
            userId,
            { profileImage: imageUrl },
            { new: true }
          );
        }
        
        res.status(200).json({
          success: true,
          data: {
            imageUrl,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
          },
          message: 'Imagen de perfil actualizada exitosamente'
        });
      });
      
    } catch (error) {
      console.error('❌ Profile image upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al subir imagen de perfil'
      });
    }
  }

  /**
   * Subir imágenes de portafolio
   */
  async uploadPortfolioImages(req, res) {
    try {
      req.uploadType = 'portfolio';
      
      this.uploadImage.array('images', 5)(req, res, async (err) => {
        if (err) {
          console.error('❌ Portfolio images upload error:', err);
          return res.status(400).json({
            success: false,
            error: err.message
          });
        }
        
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'No se proporcionaron imágenes'
          });
        }
        
        const professionalId = req.usuario.id;
        
        console.log(`📸 Uploading portfolio images: ${professionalId}`);
        
        // Generar URLs públicas
        const images = req.files.map(file => ({
          url: `/uploads/portfolio/${file.filename}`,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: new Date()
        }));
        
        // Actualizar portafolio del profesional
        const professional = await Professional.findById(professionalId);
        if (!professional) {
          return res.status(404).json({
            success: false,
            error: 'Profesional no encontrado'
          });
        }
        
        // Agregar nuevas imágenes al portafolio
        if (!professional.portfolio) {
          professional.portfolio = [];
        }
        
        professional.portfolio.push(...images);
        await professional.save();
        
        res.status(200).json({
          success: true,
          data: {
            uploaded: images,
            totalPortfolio: professional.portfolio.length
          },
          message: 'Imágenes de portafolio subidas exitosamente'
        });
      });
      
    } catch (error) {
      console.error('❌ Portfolio images upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al subir imágenes de portafolio'
      });
    }
  }

  /**
   * Subir documentos de verificación
   */
  async uploadVerificationDocuments(req, res) {
    try {
      req.uploadType = 'verification';
      
      this.uploadDocument.array('documents', 3)(req, res, async (err) => {
        if (err) {
          console.error('❌ Verification documents upload error:', err);
          return res.status(400).json({
            success: false,
            error: err.message
          });
        }
        
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'No se proporcionaron documentos'
          });
        }
        
        const professionalId = req.usuario.id;
        
        console.log(`📸 Uploading verification documents: ${professionalId}`);
        
        // Generar URLs públicas
        const documents = req.files.map(file => ({
          url: `/uploads/verification/${file.filename}`,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          type: this.getDocumentType(file.originalname),
          uploadedAt: new Date()
        }));
        
        // Actualizar documentos de verificación
        const professional = await Professional.findById(professionalId);
        if (!professional) {
          return res.status(404).json({
            success: false,
            error: 'Profesional no encontrado'
          });
        }
        
        if (!professional.verification) {
          professional.verification = {};
        }
        
        if (!professional.verification.documents) {
          professional.verification.documents = [];
        }
        
        professional.verification.documents.push(...documents);
        professional.verification.status = 'pending';
        professional.verification.submittedAt = new Date();
        
        await professional.save();
        
        res.status(200).json({
          success: true,
          data: {
            uploaded: documents,
            totalDocuments: professional.verification.documents.length,
            verificationStatus: professional.verification.status
          },
          message: 'Documentos de verificación subidos exitosamente'
        });
      });
      
    } catch (error) {
      console.error('❌ Verification documents upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al subir documentos de verificación'
      });
    }
  }

  /**
   * Subir imágenes de servicio
   */
  async uploadServiceImages(req, res) {
    try {
      req.uploadType = 'services';
      
      this.uploadImage.array('images', 3)(req, res, async (err) => {
        if (err) {
          console.error('❌ Service images upload error:', err);
          return res.status(400).json({
            success: false,
            error: err.message
          });
        }
        
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'No se proporcionaron imágenes'
          });
        }
        
        const professionalId = req.usuario.id;
        
        console.log(`📸 Uploading service images: ${professionalId}`);
        
        // Generar URLs públicas
        const images = req.files.map(file => ({
          url: `/uploads/services/${file.filename}`,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: new Date()
        }));
        
        res.status(200).json({
          success: true,
          data: {
            uploaded: images,
            count: images.length
          },
          message: 'Imágenes de servicio subidas exitosamente'
        });
      });
      
    } catch (error) {
      console.error('❌ Service images upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al subir imágenes de servicio'
      });
    }
  }

  /**
   * Eliminar archivo
   */
  async deleteFile(req, res) {
    try {
      const { fileId } = req.params;
      const { type = 'general' } = req.query;
      const userId = req.usuario.id;
      
      console.log(`📸 Deleting file: ${fileId} by user ${userId}`);
      
      // Construir ruta del archivo
      const filePath = path.join(__dirname, '../../uploads', type, fileId);
      
      // Verificar si el archivo existe
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Archivo no encontrado'
        });
      }
      
      // Eliminar archivo del sistema
      fs.unlinkSync(filePath);
      
      // Actualizar base de datos según el tipo
      if (type === 'profiles') {
        await User.findByIdAndUpdate(userId, { profileImage: '' });
        await Professional.findByIdAndUpdate(userId, { profileImage: '' });
      }
      
      res.status(200).json({
        success: true,
        message: 'Archivo eliminado exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Delete file error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al eliminar archivo'
      });
    }
  }

  /**
   * Obtener información de archivo
   */
  async getFileInfo(req, res) {
    try {
      const { fileId } = req.params;
      const { type = 'general' } = req.query;
      
      // Construir ruta del archivo
      const filePath = path.join(__dirname, '../../uploads', type, fileId);
      
      // Verificar si el archivo existe
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Archivo no encontrado'
        });
      }
      
      // Obtener estadísticas del archivo
      const stats = fs.statSync(filePath);
      
      res.status(200).json({
        success: true,
        data: {
          id: fileId,
          type,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          url: `/uploads/${type}/${fileId}`,
          accessible: true
        }
      });
      
    } catch (error) {
      console.error('❌ Get file info error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener información del archivo'
      });
    }
  }

  /**
   * Obtener lista de archivos del usuario
   */
  async getUserFiles(req, res) {
    try {
      const userId = req.usuario.id;
      const { type = 'all', limit = 20, skip = 0 } = req.query;
      
      console.log(`📸 Getting user files: ${userId}, type=${type}`);
      
      const uploadsDir = path.join(__dirname, '../../uploads');
      const userFiles = [];
      
      // Escanear directorios según el tipo
      const directories = type === 'all' 
        ? ['profiles', 'portfolio', 'verification', 'services']
        : [type];
      
      for (const dir of directories) {
        const dirPath = path.join(uploadsDir, dir);
        
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          
          for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            
            // Verificar si el archivo pertenece al usuario (simplificado)
            if (file.includes(userId.toString()) || type === 'portfolio') {
              userFiles.push({
                id: file,
                type: dir,
                url: `/uploads/${dir}/${file}`,
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                mimetype: this.getMimeType(file)
              });
            }
          }
        }
      }
      
      // Ordenar por fecha de creación
      userFiles.sort((a, b) => b.createdAt - a.createdAt);
      
      // Paginación
      const total = userFiles.length;
      const paginatedFiles = userFiles.slice(parseInt(skip), parseInt(skip) + parseInt(limit));
      
      res.status(200).json({
        success: true,
        data: paginatedFiles,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: parseInt(skip) + parseInt(limit) < total
        },
        filters: { type }
      });
      
    } catch (error) {
      console.error('❌ Get user files error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener archivos del usuario'
      });
    }
  }

  /**
   * Determinar tipo de documento
   */
  getDocumentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const documentTypes = {
      '.pdf': 'pdf',
      '.doc': 'word',
      '.docx': 'word',
      '.xls': 'excel',
      '.xlsx': 'excel'
    };
    
    return documentTypes[ext] || 'unknown';
  }

  /**
   * Determinar MIME type
   */
  getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Optimizar imagen (mock)
   */
  async optimizeImage(filePath, options = {}) {
    try {
      const {
        width = 800,
        height = 600,
        quality = 80,
        format = 'jpeg'
      } = options;
      
      // Simular optimización de imagen
      console.log(`📸 Optimizing image: ${filePath} to ${width}x${height} at ${quality}% quality`);
      
      // En una implementación real, aquí se usaría sharp o similar
      return {
        optimized: true,
        originalSize: 0, // tamaño original
        optimizedSize: 0, // tamaño optimizado
        compressionRatio: 0,
        outputPath: filePath
      };
      
    } catch (error) {
      console.error('❌ Image optimization error:', error);
      return {
        optimized: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener estadísticas de uploads
   */
  async getUploadStats(req, res) {
    try {
      const userId = req.usuario.id;
      
      console.log(`📸 Getting upload stats for user: ${userId}`);
      
      // Simular estadísticas
      const stats = {
        totalFiles: 0,
        totalSize: 0,
        byType: {
          profiles: { count: 0, size: 0 },
          portfolio: { count: 0, size: 0 },
          verification: { count: 0, size: 0 },
          services: { count: 0, size: 0 }
        },
        recentlyUploaded: [],
        storageUsed: 0,
        storageLimit: 50 * 1024 * 1024, // 50MB
        storagePercentage: 0
      };
      
      res.status(200).json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      console.error('❌ Get upload stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener estadísticas de uploads'
      });
    }
  }
}

module.exports = new UploadController();
