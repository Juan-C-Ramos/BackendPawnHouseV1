const { 
  getAll, 
  getpaymentCount, 
  create, 
  getOne, 
  remove, 
  update,
  removeByMonth,        // elimina pagos por mes/año
  setAllRegistered,     // marca todos los pagos como registrados
  setRegisteredByIds,   // marca pagos específicos como registrados
  getPaymentsByUser,    // obtiene pagos de un usuario
  getPaymentsByUserAndMonth, // obtiene pagos de un usuario filtrados por mes/año
  getPaymentsByUserByDateRange,
  getDailyClosure       // obtiene cierre diario
} = require('../controllers/payment.controller.js');

const express = require('express');
const { verifyJwt } = require('../utils/verifyJWT');

const routerPayment = express.Router();

// 📌 Rutas principales de pagos
routerPayment.route('/')
  .get(getAll)   // Obtener todos los pagos
  .post(create); // Crear nuevo pago

// 📌 Marcar todos los pagos como registrados
routerPayment.route('/setAllRegistered')
  .put(setAllRegistered);

// 📌 Marcar solo pagos seleccionados como registrados
routerPayment.route('/setRegisteredByIds')
  .put(setRegisteredByIds);

// 📌 Contador de pagos (ej: facturación)
routerPayment.route('/factura/count')
  .get(getpaymentCount);

// 📌 Eliminar todos los pagos de un mes/año (usando paymentDate)
routerPayment.route('/removeByMonth/:month')
  .delete(removeByMonth);

// ------------------------
// 🔹 Rutas de usuario (específicas primero)
// ------------------------

// 📌 Obtener cierre diario de un usuario
routerPayment.route("/user/:userId/dailyClosure")
  .get(getDailyClosure);

// 📌 Obtener pagos de un usuario filtrados por mes/año
routerPayment.route('/user/:userId/byMonth/:month')
  .get(getPaymentsByUserAndMonth);

// 📌 Obtener pagos de un usuario por rango de fechas
// Ejemplo: GET /payment/user/12/byDateRange?startDate=2025-01-01&endDate=2025-03-31
routerPayment.route('/user/:userId/byDateRange')
  .get(getPaymentsByUserByDateRange);

// 📌 Obtener pagos de un usuario (general)
routerPayment.route('/user/:userId')
  .get(getPaymentsByUser);

// ------------------------
// 🔹 CRUD por ID
// ------------------------
routerPayment.route('/:id')
  .get(getOne)    // Obtener un pago por ID
  .delete(remove) // Eliminar un pago por ID
  .put(update);   // Actualizar un pago por ID

module.exports = routerPayment;
