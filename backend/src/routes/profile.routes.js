const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const Professional = require('../models/Professional');
const { upload } = require('../config/cloudinary');

// Actualizar perfil profesional
router.put('/', requireAuth, async (req, res) => {
  try {
    const professional = await Professional.findOneAndUpdate(
      { userId: req.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!professional) {
      return res.status(404).json({ message: 'Perfil profesional no encontrado' });
    }

    res.json({ message: 'Perfil actualizado correctamente', professional });
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando perfil', error: error.message });
  }
});

// Subir múltiples imágenes a la galería
router.post('/gallery', requireAuth, upload.array('images', 10), async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.userId });
    if (!professional) {
      return res.status(404).json({ message: 'Perfil profesional no encontrado' });
    }

    const imageUrls = req.files.map(file => file.path);
    professional.gallery = [...professional.gallery, ...imageUrls];
    await professional.save();

    res.json({ message: 'Imágenes subidas correctamente', gallery: professional.gallery });
  } catch (error) {
    res.status(500).json({ message: 'Error subiendo imágenes', error: error.message });
  }
});

// Eliminar imagen de la galería
router.delete('/gallery', requireAuth, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const professional = await Professional.findOne({ userId: req.userId });
    
    if (!professional) {
      return res.status(404).json({ message: 'Perfil profesional no encontrado' });
    }

    professional.gallery = professional.gallery.filter(url => url !== imageUrl);
    await professional.save();

    // Nota: Deberíamos también eliminarla de Cloudinary usando el public_id
    // pero por ahora solo la quitamos del array.

    res.json({ message: 'Imagen eliminada', gallery: professional.gallery });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando imagen' });
  }
});

module.exports = router;
