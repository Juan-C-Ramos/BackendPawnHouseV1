const express = require('express');
const { corregirPrestamos } = require('../controllers/admin.controller');

const router = express.Router();



// 🔥 crear préstamo
router.post('/', corregirPrestamos);



module.exports = router;