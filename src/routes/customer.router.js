const { getAll, create, getOne, remove, update } = require('../controllers/customer.controller.js');
const express = require('express');
const { verifyJwt } = require('../utils/verifyJWT');

const routerCustomer = express.Router();

routerCustomer.route('/')
    .get(verifyJwt, getAll)
    .post(verifyJwt, create);

routerCustomer.route('/:id')
    .get(verifyJwt, getOne)
    .delete(verifyJwt, remove)
    .put(verifyJwt, update);

module.exports = routerCustomer;