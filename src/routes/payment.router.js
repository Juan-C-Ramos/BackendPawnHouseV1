const { 
  getAll, 
  getpaymentCount, 
  create, 
  getOne, 
  remove, 
  update,
  removeByMonth // 👈 nuevo
} = require('../controllers/payment.controller.js');

const express = require('express');
const { verifyJwt } = require('../utils/verifyJWT');

const routerPayment = express.Router();

routerPayment.route('/')
    .get(getAll) // 🔏🔐
    .post(create); // 🔏🔐

routerPayment.route('/:id')
    .get(getOne) // 🔏🔐
    .delete(remove)  // 🔏🔐
    .put(update);  // 🔏🔐

routerPayment.route('/factura/count')
    .get(getpaymentCount); // 🔏🔐

// 👉 Nueva ruta para borrar todos los pagos de un mes/año según paymentDate
routerPayment.delete('/removeByMonth/:month', removeByMonth);

module.exports = routerPayment;
