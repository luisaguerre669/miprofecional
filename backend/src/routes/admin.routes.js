const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const Professional = require('../models/Professional');
const Rating = require('../models/Rating');
const Payment = require('../models/Payment');

// Middleware para verificar rol admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
  }
  next();
};

// Obtener estadísticas globales
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProfessionals = await Professional.countDocuments();
    const pendingVerifications = await Professional.countDocuments({ 'verification.verificationStatus': 'pending' });
    const totalPayments = await Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);

    res.json({
      totalUsers,
      totalProfessionals,
      pendingVerifications,
      revenue: totalPayments[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo estadísticas' });
  }
});

// Bloquear/Desbloquear usuario
router.put('/users/:id/block', requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ message: `Usuario ${user.isActive ? 'desbloqueado' : 'bloqueado'} correctamente` });
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando usuario' });
  }
});

// Verificar profesional
router.put('/professionals/:id/verify', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body; // 'verified' o 'rejected'
    const professional = await Professional.findById(req.params.id);
    
    if (!professional) return res.status(404).json({ message: 'Profesional no encontrado' });

    professional.verification.verificationStatus = status;
    professional.verification.isVerified = status === 'verified';
    professional.verification.verificationDate = status === 'verified' ? new Date() : null;
    
    // Si se verifica, activamos el perfil (siempre que tenga suscripción o sea free por ahora)
    if (status === 'verified') {
      professional.isActive = true;
    }

    await professional.save();
    res.json({ message: 'Estado de verificación actualizado', professional });
  } catch (error) {
    res.status(500).json({ message: 'Error verificando profesional' });
  }
});

// Eliminar reseña
router.delete('/reviews/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const review = await Rating.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Reseña no encontrada' });

    review.status = 'removed';
    await review.save();

    res.json({ message: 'Reseña eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando reseña' });
  }
});

module.exports = router;
