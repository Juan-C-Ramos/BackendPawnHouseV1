const { getAll, create, getOne, remove, update } = require('../controllers/transaction.controller.js');
const express = require('express');
const { verifyJwt } = require('../utils/verifyJWT');

const routerTransaction = express.Router();

routerTransaction.route('/')
    .get(verifyJwt, getAll)
    .post(verifyJwt, create);

routerTransaction.route('/:id') 
    .get(verifyJwt, getOne)
    .delete(verifyJwt, remove)
    .put(verifyJwt, update);

module.exports = routerTransaction;