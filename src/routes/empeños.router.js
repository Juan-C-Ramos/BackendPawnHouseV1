const express = require('express')
const router = express.Router()

const contratoEmpenoCtrl = require('../controllers/ModuloEmpeños/contratoEmpeno.controller')

const pagosEmpenoCtrl = require('../controllers/ModuloEmpeños/pagos.controller')

const estadoCuentaCtrl = require('../controllers/ModuloEmpeños/estadoCuentaEmpeno.controller')

const {
  getProximosAVencer,
  getEnDeuda,
  crearContratoEmpeno,
  listarContratosEmpeno
} = require('../controllers/ModuloEmpeños/contratoEmpeno.controller');


const {
  obtenerPrendasPorContrato,
} = require("../controllers/ModuloEmpeños/prendaEmpeno.controller");

// 🔹 Endpoint que tu widget está llamando:
router.get(
  "/contratos-empeno/:contratoId/prendas",
  obtenerPrendasPorContrato
);









/*
|--------------------------------------------------------------------------
| CONTRATOS DE EMPEÑO
|--------------------------------------------------------------------------
*/
router.get(
'/contratos/:contratoId/estado-cuenta',
estadoCuentaCtrl.estadoCuentaContratoEmpeno
)

// Crear contrato de empeño (con prendas)
router.post('/contratos', crearContratoEmpeno)

// Obtener todos los contratos (filtros opcionales: userId, customerId)
router.get('/contratos', listarContratosEmpeno)

// Obtener un contrato por ID (detalle completo)
router.get('/contratos/:id', contratoEmpenoCtrl.getContratoEmpenoById)

router.post('/pagos', pagosEmpenoCtrl.registrarPagoEmpeno)

// -------- DASHBOARD --------
router.get('/dashboard/proximos-a-vencer', getProximosAVencer);
router.get('/dashboard/en-deuda', getEnDeuda);


module.exports = router
