const express = require("express");
const { generarDeclaracionPertenencia } = require("../controllers/ModuloEmpeños/declaracion.controller.js");

const router = express.Router();

router.post("/declaracion-pertenencia", generarDeclaracionPertenencia);

module.exports = router;
