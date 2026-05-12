const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const Rating = require('../models/Rating');
const Booking = require('../models/Booking');
const Professional = require('../models/Professional');
const User = require('../models/User');

// Crear una reseña
router.post('/', requireAuth, async (req, res) => {
  try {
    const { professionalId, bookingId, rating, review, categories, type } = req.body;

    // Validar que la reserva exista y esté completada
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    if (booking.status !== 'completed' && process.env.NODE_ENV === 'production') {
      return res.status(400).json({ message: 'Solo se pueden calificar servicios completados' });
    }

    // Validar que el usuario sea parte de la reserva
    if (type === 'client-to-professional' && booking.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'No tienes permiso para calificar esta reserva' });
    }

    if (type === 'professional-to-client') {
      const professional = await Professional.findOne({ userId: req.userId });
      if (!professional || booking.professional.toString() !== professional._id.toString()) {
        return res.status(403).json({ message: 'No tienes permiso para calificar esta reserva' });
      }
    }

    // Evitar reseñas duplicadas
    const existingRating = await Rating.findOne({ booking: bookingId, type });
    if (existingRating) {
      return res.status(400).json({ message: 'Ya has calificado este servicio' });
    }

    const newRating = await Rating.create({
      user: booking.user,
      professional: booking.professional,
      booking: bookingId,
      rating,
      review,
      categories,
      type: type || 'client-to-professional',
      status: 'published'
    });

    // Actualizar reputación del profesional si es client-to-professional
    if (type === 'client-to-professional' || !type) {
      const pro = await Professional.findById(booking.professional);
      if (pro) {
        await pro.updateRating();
      }
    }

    res.status(201).json({ message: 'Reseña publicada correctamente', rating: newRating });
  } catch (error) {
    console.error('Error publicando reseña:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener reseñas de un profesional
router.get('/professional/:id', async (req, res) => {
  try {
    const ratings = await Rating.find({ 
      professional: req.params.id, 
      type: 'client-to-professional',
      status: 'published' 
    })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });

    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo reseñas' });
  }
});

module.exports = router;
