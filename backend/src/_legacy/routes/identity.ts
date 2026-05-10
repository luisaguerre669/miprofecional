import { Router } from 'express';
import {
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
} from '../controllers/identityController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /api/identity/initiate - Iniciar proceso de verificación
router.post('/initiate', initiateVerification);

// POST /api/identity/selfie - Subir selfie
router.post('/selfie', upload.single('selfie'), uploadSelfie);

// POST /api/identity/license - Subir matrícula profesional
router.post('/license', upload.single('license'), uploadLicense);

// POST /api/identity/verify-code - Verificar código
router.post('/verify-code', verifyCode);

// POST /api/identity/google - Verificar con Google
router.post('/google', verifyWithGoogle);

// GET /api/identity/status - Obtener estado de verificación
router.get('/status', getVerificationStatus);

// POST /api/identity/resend - Reenviar código de verificación
router.post('/resend', resendVerificationCode);

// Rutas de administrador
router.use('/admin', requireRole('admin'));

// GET /api/identity/admin/pending - Obtener verificaciones pendientes
router.get('/admin/pending', getPendingVerifications);

// POST /api/identity/admin/:verificationId/approve - Aprobar verificación
router.post('/admin/:verificationId/approve', approveVerification);

// POST /api/identity/admin/:verificationId/reject - Rechazar verificación
router.post('/admin/:verificationId/reject', rejectVerification);

export default router;
