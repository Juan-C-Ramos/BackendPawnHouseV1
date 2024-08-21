const { getAll, create, getOne, remove, update } = require('../controllers/payment.controller.js');
const express = require('express');
const { verifyJwt } = require('../utils/verifyJWT');

const routerPayment = express.Router();

routerPayment.route('/')
    .get(verifyJwt, getAll) // 🔏🔐
    .post(verifyJwt, create); // 🔏🔐

routerPayment.route('/:id')
    .get(verifyJwt, getOne) // 🔏🔐
    .delete(verifyJwt, remove)  // 🔏🔐
    .put(verifyJwt, update);  // 🔏🔐

module.exports = routerPayment;