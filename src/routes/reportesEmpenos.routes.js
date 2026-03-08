const express = require("express");
const router = express.Router();
const {
  reporteIngresos,
} = require("../controllers/ModuloEmpeños/reportesEmpenos.controller");

// GET /empenos/reportes/ingresos
router.get("/ingresos", reporteIngresos);

module.exports = router;