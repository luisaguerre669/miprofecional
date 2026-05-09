const express = require('express');
const router = express.Router();

// Placeholder for MercadoPago routes
// TODO: Implement MercadoPago integration

router.post('/', (req, res) => {
  res.json({
    success: true,
    message: 'MercadoPago endpoint - placeholder',
    data: null
  });
});

module.exports = router;
