// routes/reciboPago.routes.js
const express = require("express");
const { generarReciboPagoPDF } = require("../controllers/ModuloEmpeños/reciboPdf.controller");

const router = express.Router();

router.get("/recibo-pago/:pagoId", generarReciboPagoPDF);

module.exports = router;
