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
    getEmpeñoTransactions,
    getIdContract,
    createManyContracts,
    getTransactionsByCustomer,
    setPaidTransactions,
    getTransactionsByDate // 👉 asegurarte de exportarlo desde el controlador
} = require('../controllers/transaction.controller.js');

const express = require('express');
const { verifyJwt } = require('../utils/verifyJWT');
const routerTransaction = express.Router();

// rutas generales
routerTransaction.route('/')
    .get(getAll)
    .post(create);

// 👉 filtrar por fecha o rango de fechas
routerTransaction.route('/filter')
    .get(getTransactionsByDate);

// marcar pagos como pagados
routerTransaction.route('/setPaidTransactions')
    .put(setPaidTransactions);

// transacciones de un cliente
routerTransaction.route('/customer/:customerId')
    .get(getTransactionsByCustomer);

// contratos, cuotas e inventario
routerTransaction.route('/:id/contracts')
    .post(setContract);

routerTransaction.route('/:id/cuotes')
    .post(setCuote);

routerTransaction.route('/:id/inventoryBills')
    .post(setInventoryBill);

// obtener número de contrato
routerTransaction.route('/numeroContrato')
    .get(getIdContract);

// tipos de transacciones
routerTransaction.route('/prestamos')
    .get(getPrestamosTransactions);

routerTransaction.route('/venta')
    .get(getVentasTransactions);

routerTransaction.route('/empeno')
    .get(getEmpeñoTransactions);

// crear muchos contratos
routerTransaction.route('/bulk')
    .post(createManyContracts);

// operaciones sobre una transacción específica
routerTransaction.route('/:id')
    .get(getOne)
    .delete(remove)
    .put(update);

module.exports = routerTransaction;
