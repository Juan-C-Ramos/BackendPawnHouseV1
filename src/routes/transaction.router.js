const { getAll, create, getOne, remove, update, setContract, setInventoryBill, setProofOfService } = require('../controllers/transaction.controller.js');
const express = require('express');
const { verifyJwt } = require('../utils/verifyJWT');

const routerTransaction = express.Router();

routerTransaction.route('/')
    .get( getAll)
    .post( create);

    
routerTransaction.route('/:id/contracts')
    .post(setContract);

    
routerTransaction.route('/:id/inventoryBills')
    .post(setInventoryBill);


routerTransaction.route('/:id') 
    .get( getOne)
    .delete( remove)
    .put( update);

module.exports = routerTransaction;