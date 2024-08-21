const { getAll, create, getOne, remove, update } = require('../controllers/inventory.controller');
const express = require('express');
const { verifyJwt } = require('../utils/verifyJWT');

const routerInventory = express.Router();

routerInventory.route('/')
    .get(getAll)
    .post(verifyJwt, create);

routerInventory.route('/:id')
    .get(getOne)
    .delete(verifyJwt, remove)
    .put(verifyJwt, update);

module.exports = routerInventory;