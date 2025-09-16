const { 
  getAll, 
  getpaymentCount, 
  create, 
  getOne, 
  remove, 
  update,
  removeByMonth, // 👈 existente
  setAllRegistered, // 👈 nuevo
  setRegisteredByIds, // 👈 nuevo
  getPaymentsByUser // 👈 nuevo
} = require('../controllers/payment.controller.js');

const express = require('express');
const { verifyJwt } = require('../utils/verifyJWT');

const routerPayment = express.Router();

routerPayment.route('/')
    .get(getAll) // 🔏🔐
    .post(create); // 🔏🔐
    
    
    // 👉 Nueva ruta: actualizar TODOS los pagos a isRegistered = true
    routerPayment.route('/setAllRegistered')
    .put(setAllRegistered);
    
    // 👉 Nueva ruta: actualizar SOLO los pagos pasados por body (ids: [])
    routerPayment.route('/setRegisteredByIds')
    .put(setRegisteredByIds);
    
    routerPayment.route('/:id')
    .get(getOne) // 🔏🔐
    .delete(remove)  // 🔏🔐
    .put(update);  // 🔏🔐
    
    routerPayment.route('/factura/count')
    .get(getpaymentCount); // 🔏🔐
    
    // 👉 Nueva ruta para borrar todos los pagos de un mes/año según paymentDate
    routerPayment.route('/removeByMonth/:month')
        .delete(removeByMonth);



routerPayment.route('/user/:userId')
.get(getPaymentsByUser);

module.exports = routerPayment;
