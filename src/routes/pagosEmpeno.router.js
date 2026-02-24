const express = require("express");
const router = express.Router();

const {
  registrarPagoEmpeno,
  listarPagosPorContrato,
  obtenerPagosPorContrato,
  updatePagoEmpeno
} = require("../controllers/ModuloEmpeños/pagos.controller.js");


// 📌 LISTAR PAGOS DE UN CONTRATO
router.get(
  "/contratos-empeno/:contratoId/pagos",
  obtenerPagosPorContrato
);

// Registrar un pago
router.post("/pago", registrarPagoEmpeno);

router.put('/pagos/:id', updatePagoEmpeno);

// Listar pagos de un contrato
router.get(
  "/contratos-empeno/:contratoEmpenoId/pagos",
  listarPagosPorContrato
);

module.exports = router;
