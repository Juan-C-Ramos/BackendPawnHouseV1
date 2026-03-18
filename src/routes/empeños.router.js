const express = require('express')
const router = express.Router()

// Controllers
const contratoEmpenoCtrl = require('../controllers/ModuloEmpeños/contratoEmpeno.controller')

const pagosEmpenoCtrl = require('../controllers/ModuloEmpeños/pagos.controller')

const estadoCuentaCtrl = require('../controllers/ModuloEmpeños/estadoCuentaEmpeno.controller')

const {
  getProximosAVencer,
  getEnDeuda,
  crearContratoEmpeno,
  listarContratosEmpeno,
  updateContratoEmpeno,
  obtenerKpisDashboard,
  liquidarContratoEmpeno

} = require('../controllers/ModuloEmpeños/contratoEmpeno.controller')

const {
  obtenerPrendasPorContrato,
} = require("../controllers/ModuloEmpeños/prendaEmpeno.controller")

const {registrarVenta, getPrendasDisponibles} = require("../controllers/ModuloEmpeños/ventas.controller")


/*
|--------------------------------------------------------------------------
| PRENDAS
|--------------------------------------------------------------------------
*/

// Obtener prendas por contrato
router.get(
  "/contratos-empeno/:contratoId/prendas",
  obtenerPrendasPorContrato
)

router.post("/ventas", registrarVenta);
router.get("/ventas/prendas-disponibles", getPrendasDisponibles);

router.get("/kpis", obtenerKpisDashboard);



/*
|--------------------------------------------------------------------------
| ESTADO DE CUENTA
|--------------------------------------------------------------------------
*/

router.get(
  '/contratos/:contratoId/estado-cuenta',
  estadoCuentaCtrl.estadoCuentaContratoEmpeno
)



/*
|--------------------------------------------------------------------------
| CONTRATOS DE EMPEÑO
|--------------------------------------------------------------------------
*/

// Crear contrato
router.post(
  '/contratos',
  crearContratoEmpeno
)


// Listar contratos
router.get(
  '/contratos',
  listarContratosEmpeno
)


// Obtener contrato por ID
router.get(
  '/contratos/:id',
  contratoEmpenoCtrl.getContratoEmpenoById
)


// ✅ ACTUALIZAR CONTRATO Y PRENDAS
router.put(
  '/contratos/:id',
  updateContratoEmpeno
)



/*
|--------------------------------------------------------------------------
| PAGOS
|--------------------------------------------------------------------------
*/

// Registrar pago
router.post(
  '/pagos',
  pagosEmpenoCtrl.registrarPagoEmpeno
)



/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

router.get(
  '/dashboard/proximos-a-vencer',
  getProximosAVencer
)

router.get(
  '/dashboard/en-deuda',
  getEnDeuda
)


router.put(
  "/contratos/:id/liquidar",
  liquidarContratoEmpeno
);





module.exports = router