const express = require("express");
const router = express.Router();
const {
  reporteIngresos,
  obtenerKpisReportes,
  obtenerContratosActivos
} = require("../controllers/ModuloEmpeños/reportesEmpenos.controller");

// GET /empenos/reportes/ingresos
router.get("/ingresos", reporteIngresos);
router.get("/kpis", obtenerKpisReportes);
router.get("/contratos-activos", obtenerContratosActivos);


module.exports = router;