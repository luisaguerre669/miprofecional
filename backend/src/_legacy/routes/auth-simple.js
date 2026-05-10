const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { inputSanitizer } = require('../middleware/inputSanitizer');

// Ruta pública con sanitización
router.post('/login', inputSanitizer, login);

// Ruta protegida
router.get('/profile', authMiddleware, (req, res) => {
  res.json({ 
    user: req.user,
    message: 'Perfil obtenido exitosamente'
  });
});

module.exports = router;
