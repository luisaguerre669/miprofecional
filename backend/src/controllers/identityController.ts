import { Request, Response } from 'express';
import { IdentityVerification } from '../models/IdentityVerification';
import { User } from '../models';
import { Professional } from '../models';
import { sendVerificationEmail, sendWhatsAppMessage, sendMessengerMessage } from '../services/notificationService';
import { generateVerificationCode, validateSelfie, validateLicenseImage } from '../services/verificationService';
import { uploadImageToCloud } from '../services/uploadService';

// Iniciar proceso de verificación
export const initiateVerification = async (req: Request, res: Response) => {
  try {
    const { verificationMethod, verificationData } = req.body;
    const userId = req.user.id;
    const userType = req.user.userType;

    // Verificar si ya existe una verificación pendiente
    const existingVerification = await IdentityVerification.findOne({
      userId,
      verificationStatus: 'pending'
    });

    if (existingVerification) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes una verificación en proceso'
      });
    }

    // Crear nueva verificación
    const verification = new IdentityVerification({
      userId,
      userType,
      verificationMethod,
      verificationData
    });

    // Generar código de verificación si es necesario
    if (['whatsapp', 'messenger', 'email'].includes(verificationMethod)) {
      const code = verification.generateVerificationCode();
      
      // Enviar código según el método
      switch (verificationMethod) {
        case 'email':
          await sendVerificationEmail(verificationData.email, code);
          break;
        case 'whatsapp':
          await sendWhatsAppMessage(verificationData.whatsappNumber, code);
          break;
        case 'messenger':
          await sendMessengerMessage(verificationData.messengerUserId, code);
          break;
      }
    }

    await verification.save();

    res.status(201).json({
      success: true,
      message: 'Proceso de verificación iniciado correctamente',
      data: {
        verificationId: verification._id,
        method: verificationMethod,
        requiresCode: ['whatsapp', 'messenger', 'email'].includes(verificationMethod)
      }
    });
  } catch (error) {
    console.error('Error initiating verification:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar verificación',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Subir selfie
export const uploadSelfie = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { selfieImage } = req.body; // Base64

    if (!selfieImage) {
      return res.status(400).json({
        success: false,
        message: 'La selfie es requerida'
      });
    }

    // Validar imagen de selfie
    const validationResult = await validateSelfie(selfieImage);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: validationResult.error
      });
    }

    // Subir imagen a la nube
    const imageUrl = await uploadImageToCloud(selfieImage, 'selfies');

    // Actualizar o crear verificación
    let verification = await IdentityVerification.findOne({
      userId,
      verificationStatus: 'pending'
    });

    if (!verification) {
      verification = new IdentityVerification({
        userId,
        userType: req.user.userType,
        verificationMethod: 'selfie'
      });
    }

    verification.selfieImage = imageUrl;
    await verification.save();

    res.json({
      success: true,
      message: 'Selfie subida correctamente',
      data: { imageUrl }
    });
  } catch (error) {
    console.error('Error uploading selfie:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir selfie',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Subir matrícula profesional
export const uploadLicense = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { 
      licenseImage, 
      licenseNumber, 
      professionType, 
      licenseExpiryDate,
      issuingAuthority 
    } = req.body;

    if (!licenseImage || !licenseNumber) {
      return res.status(400).json({
        success: false,
        message: 'La imagen y número de matrícula son requeridos'
      });
    }

    // Validar imagen de matrícula
    const validationResult = await validateLicenseImage(licenseImage);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: validationResult.error
      });
    }

    // Subir imagen a la nube
    const imageUrl = await uploadImageToCloud(licenseImage, 'licenses');

    // Actualizar o crear verificación
    let verification = await IdentityVerification.findOne({
      userId,
      verificationStatus: 'pending'
    });

    if (!verification) {
      verification = new IdentityVerification({
        userId,
        userType: 'professional',
        verificationMethod: 'selfie'
      });
    }

    verification.professionalData = {
      hasLicense: true,
      licenseNumber,
      licenseImage: imageUrl,
      professionType,
      licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : undefined,
      issuingAuthority
    };

    await verification.save();

    res.json({
      success: true,
      message: 'Matrícula subida correctamente',
      data: { imageUrl }
    });
  } catch (error) {
    console.error('Error uploading license:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir matrícula',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Verificar código
export const verifyCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    const verification = await IdentityVerification.findOne({
      userId,
      verificationStatus: 'pending'
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró verificación pendiente'
      });
    }

    if (verification.verificationCode !== code) {
      verification.verificationAttempts += 1;
      await verification.save();

      return res.status(400).json({
        success: false,
        message: 'Código incorrecto',
        attemptsLeft: 10 - verification.verificationAttempts
      });
    }

    // Verificar si puede reintentar
    if (!verification.canRetryVerification()) {
      verification.verificationStatus = 'expired';
      await verification.save();

      return res.status(400).json({
        success: false,
        message: 'Demasiados intentos. Por favor, inicia el proceso nuevamente'
      });
    }

    // Marcar como verificado
    await verification.verify();

    // Actualizar estado del usuario
    await User.findByIdAndUpdate(userId, { isVerified: true });

    if (req.user.userType === 'professional') {
      await Professional.findOneAndUpdate(
        { userId },
        { isVerified: true, isVisible: true }
      );
    }

    res.json({
      success: true,
      message: 'Verificación completada exitosamente'
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar código',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Verificar con Google
export const verifyWithGoogle = async (req: Request, res: Response) => {
  try {
    const { googleId, email, name } = req.body;
    const userId = req.user.id;

    // Aquí iría la lógica de verificación con Google OAuth
    // Por ahora, simulamos la verificación

    let verification = await IdentityVerification.findOne({
      userId,
      verificationStatus: 'pending'
    });

    if (!verification) {
      verification = new IdentityVerification({
        userId,
        userType: req.user.userType,
        verificationMethod: 'google'
      });
    }

    verification.verificationData = {
      googleId,
      email
    };

    await verification.verify();

    // Actualizar estado del usuario
    await User.findByIdAndUpdate(userId, { 
      isVerified: true,
      email,
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' ')
    });

    if (req.user.userType === 'professional') {
      await Professional.findOneAndUpdate(
        { userId },
        { isVerified: true, isVisible: true }
      );
    }

    res.json({
      success: true,
      message: 'Verificación con Google completada exitosamente'
    });
  } catch (error) {
    console.error('Error verifying with Google:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar con Google',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Obtener estado de verificación
export const getVerificationStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const verification = await IdentityVerification.findOne({
      userId
    }).sort({ createdAt: -1 });

    if (!verification) {
      return res.json({
        success: true,
        data: { status: 'none' }
      });
    }

    res.json({
      success: true,
      data: {
        status: verification.verificationStatus,
        method: verification.verificationMethod,
        createdAt: verification.createdAt,
        verifiedAt: verification.verifiedAt,
        rejectionReason: verification.rejectionReason,
        attemptsLeft: 10 - verification.verificationAttempts
      }
    });
  } catch (error) {
    console.error('Error getting verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estado de verificación',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Obtener verificaciones pendientes (admin)
export const getPendingVerifications = async (req: Request, res: Response) => {
  try {
    const verifications = await IdentityVerification.findPendingVerifications()
      .populate('userId', 'firstName lastName email userType')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: verifications
    });
  } catch (error) {
    console.error('Error getting pending verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener verificaciones pendientes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Aprobar verificación (admin)
export const approveVerification = async (req: Request, res: Response) => {
  try {
    const { verificationId } = req.params;
    const { adminNotes } = req.body;

    const verification = await IdentityVerification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verificación no encontrada'
      });
    }

    await verification.verify();
    if (adminNotes) verification.adminNotes = adminNotes;

    // Actualizar estado del usuario
    await User.findByIdAndUpdate(verification.userId, { isVerified: true });

    if (verification.userType === 'professional') {
      await Professional.findOneAndUpdate(
        { userId: verification.userId },
        { isVerified: true, isVisible: true }
      );
    }

    res.json({
      success: true,
      message: 'Verificación aprobada exitosamente'
    });
  } catch (error) {
    console.error('Error approving verification:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aprobar verificación',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Rechazar verificación (admin)
export const rejectVerification = async (req: Request, res: Response) => {
  try {
    const { verificationId } = req.params;
    const { rejectionReason, adminNotes } = req.body;

    const verification = await IdentityVerification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verificación no encontrada'
      });
    }

    await verification.reject(rejectionReason, adminNotes);

    // Actualizar estado del usuario
    await User.findByIdAndUpdate(verification.userId, { isVerified: false });

    if (verification.userType === 'professional') {
      await Professional.findOneAndUpdate(
        { userId: verification.userId },
        { isVerified: false, isVisible: false }
      );
    }

    res.json({
      success: true,
      message: 'Verificación rechazada exitosamente'
    });
  } catch (error) {
    console.error('Error rejecting verification:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar verificación',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Reenviar código de verificación
export const resendVerificationCode = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const verification = await IdentityVerification.findOne({
      userId,
      verificationStatus: 'pending'
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró verificación pendiente'
      });
    }

    if (!verification.canRetryVerification()) {
      return res.status(400).json({
        success: false,
        message: 'No se pueden reenviar más códigos. Demasiados intentos.'
      });
    }

    const code = verification.generateVerificationCode();

    // Reenviar código según el método
    switch (verification.verificationMethod) {
      case 'email':
        await sendVerificationEmail(verification.verificationData.email, code);
        break;
      case 'whatsapp':
        await sendWhatsAppMessage(verification.verificationData.whatsappNumber, code);
        break;
      case 'messenger':
        await sendMessengerMessage(verification.verificationData.messengerUserId, code);
        break;
    }

    await verification.save();

    res.json({
      success: true,
      message: 'Código reenviado correctamente'
    });
  } catch (error) {
    console.error('Error resending verification code:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reenviar código',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export default {
  initiateVerification,
  uploadSelfie,
  uploadLicense,
  verifyCode,
  verifyWithGoogle,
  getVerificationStatus,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  resendVerificationCode
};
