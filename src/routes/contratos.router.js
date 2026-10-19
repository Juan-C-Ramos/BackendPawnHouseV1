const {
  generarContratoPrestamoPorcentajePDF,
} = require("../controllers/contratoPagare.controller.js");

const {
  generarContratoCompraventaFinanciamientoPDF,
} = require("../controllers/contratoCompraventa.controller.js");

const {
  generarContratoPrestamoCuotaFijaPDF,
} = require("../controllers/contratoCuotas.controller.js");

const express = require("express");
const routerContrato = express.Router();

// rutas generales
routerContrato
  .route("/prestamo/porcentaje/:id")
  .get(generarContratoPrestamoPorcentajePDF);

routerContrato
  .route("/prestamo/cuota-fija/:id")
  .get(generarContratoPrestamoCuotaFijaPDF);

routerContrato
  .route("/compraventa/financiamiento/:id")
  .get(generarContratoCompraventaFinanciamientoPDF);

module.exports = routerContrato;