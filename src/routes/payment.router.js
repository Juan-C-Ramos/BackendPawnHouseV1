const { getAll, create, getOne, remove, update } = require('../controllers/payment.controller.js');
const express = require('express');
const { verifyJwt } = require('../utils/verifyJWT');

const routerPayment = express.Router();

routerPayment.route('/')
    .get( getAll) // 🔏🔐
    .post( create); // 🔏🔐

routerPayment.route('/:id')
    .get( getOne) // 🔏🔐
    .delete( remove)  // 🔏🔐
    .put( update);  // 🔏🔐

module.exports = routerPayment;