const { 
    getAll, 
    create, 
    getOne, 
    remove, 
    update, 
    setContract, 
    setInventoryBill, 
    setProofOfService, 
    setCuote, 
    getPrestamosTransactions, 
    getVentasTransactions, 
    getEmpeñoTransactions ,
    getIdContract,
    createManyContracts
} = require('../controllers/transaction.controller.js');
const express = require('express');
const { verifyJwt } = require('../utils/verifyJWT');
const routerTransaction = express.Router();

routerTransaction.route('/')
    .get(getAll)
    .post(create);

    
    routerTransaction.route('/:id/contracts')
    .post(setContract);
    
    routerTransaction.route('/:id/cuotes')
    .post(setCuote);
    
    routerTransaction.route('/:id/inventoryBills')
    .post(setInventoryBill);
    
    routerTransaction.route('/numeroContrato')
    .get(getIdContract);
    routerTransaction.route('/prestamos')
    .get(getPrestamosTransactions);
    
    routerTransaction.route('/venta')
    .get(getVentasTransactions);
    
    routerTransaction.route('/bulk')
        .post(createManyContracts);
    
routerTransaction.route('/empeno')
    .get(getEmpeñoTransactions);

routerTransaction.route('/:id')
    .get(getOne)
    .delete(remove)
    .put(update);

module.exports = routerTransaction;
