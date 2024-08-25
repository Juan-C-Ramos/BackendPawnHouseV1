const express = require('express');
const routerCustomer = require('./customer.router.js');
const routerInventory = require('./inventory.router.js');
const routerMainData = require('./mainData.router.js');
const routerPayment = require('./payment.router.js');
const routerTransaction = require('./transaction.router.js');
const routerUser = require('./user.router.js');
const routerCategory = require('./category.router.js');
const routerRole = require('./role.router.js');
const routerBranch = require('./branch.router.js');
const routerImage = require('./image.router.js');
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
router.use('/images', routerImage),


module.exports = router;