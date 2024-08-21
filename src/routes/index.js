const express = require('express');
const routerCustomer = require('./customer.router');
const routerInventory = require('./inventory.router');
const routerMainData = require('./mainData.router');
const routerPayment = require('./payment.router');
const routerTransaction = require('./transaction.router');
const routerUser = require('./user.router');
const routerCategory = require('./category.router');
const routerRole = require('./role.router');
const routerBranch = require('./branch.router');
const router = express.Router();




router.use('/customer', routerCustomer),
router.use('/inventories', routerInventory),
router.use('/mainData', routerMainData),
router.use('/payments', routerPayment),
router.use('/transactions', routerTransaction),
router.use('/users', routerUser),
router.use('/categories', routerCategory),
router.use('/roles', routerRole),
router.use('/branches', routerBranch),


module.exports = router;