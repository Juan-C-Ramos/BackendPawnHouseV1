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
const routerImageInventory = require('./imageInventory.router.js');
const routerProfilePhoto = require('./profilePhoto.router.js');
const routerContract = require('./contract.router.js');
const routerProofOfService = require('./proofOfService.router.js');
const routerInventoryBill = require('./inventoryBill.router.js');
const routerIDPhoto = require('./idPhoto.router.js');
const routerCuote = require('./cuote.router.js');
const { verifyJwt } = require('../utils/verifyJWT.js');
const router = express.Router();




router.use('/customer',verifyJwt, routerCustomer),
router.use('/inventories',verifyJwt, routerInventory),
router.use('/mainData',verifyJwt, routerMainData),
router.use('/payments',verifyJwt, routerPayment),
router.use('/transactions',verifyJwt, routerTransaction),
router.use('/users', routerUser),
router.use('/categories',verifyJwt, routerCategory),
router.use('/roles',verifyJwt, routerRole),
router.use('/branches',verifyJwt, routerBranch),
router.use('/coutes',verifyJwt, routerCuote)

// Images
router.use('/images/inventory', routerImageInventory),
router.use('/images/profilePhoto', routerProfilePhoto),
router.use('/images/contract', routerContract),
router.use('/images/proofOfService', routerProofOfService),
router.use('/images/inventoryBill', routerInventoryBill),
router.use('/images/idPhoto', routerIDPhoto),


module.exports = router;