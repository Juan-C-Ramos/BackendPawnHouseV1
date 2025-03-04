const { getAll, create, getOne, remove, update, setImage, setBillImage, getOnSaleItems } = require('../controllers/inventory.controller.js');
const express = require('express');
const { verifyJwt } = require('../utils/verifyJWT');

const routerInventory = express.Router();

routerInventory.route('/')
    .get(getAll)
    .post( create);

routerInventory.route('/isOnSale?')
        .get(getOnSaleItems)

routerInventory.route('/:id/images')
    .post(setImage);

routerInventory.route('/:id/billImages')
    .post(setBillImage);

routerInventory.route('/:id')
    .get(getOne)
    .delete( remove)
    .put( update);



module.exports = routerInventory;