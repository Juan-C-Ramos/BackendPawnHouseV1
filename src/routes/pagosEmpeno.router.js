const express = require("express");
const router = express.Router();

const {
  registrarPagoEmpeno,
  listarPagosPorContrato,
  obtenerPagosPorContrato
} = require("../controllers/ModuloEmpeños/pagos.controller.js");


// 📌 LISTAR PAGOS DE UN CONTRATO
router.get(
  "/contratos-empeno/:contratoId/pagos",
  obtenerPagosPorContrato
);

// Registrar un pago
router.post("/pago", registrarPagoEmpeno);

// Listar pagos de un contrato
router.get(
  "/contratos-empeno/:contratoEmpenoId/pagos",
  listarPagosPorContrato
);

module.exports = router;
