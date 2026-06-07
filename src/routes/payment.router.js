const { 
  getAll, 
  getpaymentCount, 
  create, 
  getOne, 
  remove, 
  update,
  removeByMonth,
  setAllRegistered,
  setRegisteredByIds,
  getPaymentsByUser,
  getPaymentsByUserAndMonth,
  getPaymentsByUserByDateRange,
  getDailyClosure,
  getAllPaymentUser,
  getPaymentsByDate,         // ✅ nuevo
  getPaymentsByDateRange,     // ✅ nuevo
  createAmortizado
} = require('../controllers/payment.controller.js');

const express = require('express');
const { verifyJwt } = require('../utils/verifyJWT');
const { generarReciboPagoPrestamoPDF } = require('../controllers/reciboPagoPrestamo.controller.js');

const routerPayment = express.Router();

// ------------------------
// 📌 Rutas principales de pagos
// ------------------------
routerPayment.route('/')
  .get(getAll)   // Obtener todos los pagos
  .post(create); // Crear nuevo pago

routerPayment.route('/paymentsUsers')
  .get(getAllPaymentUser);   // Obtener todos los pagos de la relación usuario-pago

routerPayment.post("/amortizado", createAmortizado);

// ------------------------
// 📌 Marcar pagos como registrados
// ------------------------
routerPayment.route('/setAllRegistered')
  .put(setAllRegistered);

routerPayment.route('/setRegisteredByIds')
  .put(setRegisteredByIds);

// ------------------------
// 📌 Contador de pagos (ej: facturación)
// ------------------------
routerPayment.route('/factura/count')
  .get(getpaymentCount);

// ------------------------
// 📌 Eliminar pagos por mes/año
// ------------------------
routerPayment.route('/removeByMonth/:month')
  .delete(removeByMonth);

// ------------------------
// 🔹 Rutas de pagos por fecha (sin filtrar por usuario)
// ------------------------

// Obtener pagos de una fecha específica
// GET /payment/byDate/2025-09-28?splitItbms=true
routerPayment.route('/byDate/:date')
  .get(getPaymentsByDate);

// Obtener pagos en un rango de fechas
// GET /payment/byDateRange?startDate=2025-09-01&endDate=2025-09-30&splitItbms=true
routerPayment.route('/byDateRange')
  .get(getPaymentsByDateRange);

// ------------------------
// 🔹 Rutas de usuario
// ------------------------

// Obtener cierre diario de un usuario
routerPayment.route("/user/:userId/dailyClosure")
  .get(getDailyClosure);

// Obtener pagos de un usuario filtrados por mes/año
routerPayment.route('/user/:userId/byMonth/:month')
  .get(getPaymentsByUserAndMonth);

// Obtener pagos de un usuario por rango de fechas
// GET /payment/user/12/byDateRange?startDate=2025-01-01&endDate=2025-03-31
routerPayment.route('/user/:userId/byDateRange')
  .get(getPaymentsByUserByDateRange);

// Obtener pagos de un usuario (general)
routerPayment.route('/user/:userId')
  .get(getPaymentsByUser);

routerPayment.get(
  "/recibo-prestamo/:pagoId",
  generarReciboPagoPrestamoPDF
);

// ------------------------
// 🔹 CRUD por ID
// ------------------------
routerPayment.route('/:id')
  .get(getOne)    // Obtener un pago por ID
  .delete(remove) // Eliminar un pago por ID
  .put(update);   // Actualizar un pago por ID

module.exports = routerPayment;
