const express = require("express");
const router = express.Router();
const {
  reporteIngresos,
  obtenerKpisReportes,
  obtenerContratosActivos,
  obtenerContratosEnDeuda,
  obtenerContratosVencidos
} = require("../controllers/ModuloEmpeños/reportesEmpenos.controller");

// GET /empenos/reportes/ingresos
router.get("/ingresos", reporteIngresos);
router.get("/kpis", obtenerKpisReportes);
router.get("/contratos-activos", obtenerContratosActivos);
router.get("/contratos-en-deuda", obtenerContratosEnDeuda);

router.get("/contratos-vencidos", obtenerContratosVencidos);

module.exports = router;
