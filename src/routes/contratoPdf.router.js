const express = require("express");
const { generarContratoEmpenoPDF } = require("../controllers/ModuloEmpeños/contratoPdf.controller.js");

const router = express.Router();

router.post("/", generarContratoEmpenoPDF);

module.exports = router;
