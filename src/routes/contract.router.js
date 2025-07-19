// routes/contract.router.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const contractController = require('../controllers/contract.controller');

// Configura Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'), // carpeta temporal
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

router.post('/', contractController.create);
router.get('/', contractController.getAll);
router.delete('/:id', contractController.remove);

module.exports = router;
