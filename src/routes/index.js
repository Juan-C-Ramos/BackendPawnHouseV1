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
const routerLoginRegister = require('./loginRegister.router.js');
const routerRefinanciamientos = require('./refinanciamientos.router.js');
const routerEmpenos = require ('./empeños.router.js')
const router = express.Router();
const pagosEmpenoRouter = require('./pagosEmpeno.router.js');

const routerDeclaracion = require('./declaracion.router.js');

const routerContratoPDF = require("./contratoPdf.router");
const pagosEmpenos = require("./reciboPago.routes.js");

const reporteIngresos = require("./reportesEmpenos.routes.js");
const amortizedLoanRouter = require('./amortizedLoan.router');
const adminRouter = require('./admin.router.js');

router.use('/amortized-loans', amortizedLoanRouter);

// Rutas de reportes de empeños
router.use('/reportes-empenos', reporteIngresos);





// Rutas de pagos de empeños
router.use('/pagos-empenos', pagosEmpenoRouter);






router.use('/customer', routerCustomer),
router.use('/inventories',verifyJwt, routerInventory),
router.use('/mainData',verifyJwt, routerMainData),
router.use('/payments',verifyJwt, routerPayment),
router.use('/transactions',verifyJwt, routerTransaction),
router.use('/users', routerUser),
router.use('/categories', routerCategory),
router.use('/roles', routerRole),
router.use('/branches',verifyJwt, routerBranch),
router.use('/coutes',verifyJwt, routerCuote)
router.use('/loginRegisters',verifyJwt, routerLoginRegister)
router.use('/refinanciamientos',verifyJwt, routerRefinanciamientos);

router.use('/empenos', routerEmpenos)

// Images
router.use('/images/inventory', routerImageInventory),
router.use('/images/profilePhoto', routerProfilePhoto),
router.use('/contracts', routerContract),
router.use('/images/proofOfService', routerProofOfService),
router.use('/images/inventoryBill', routerInventoryBill),
router.use('/images/idPhoto', routerIDPhoto),

router.use('/', routerDeclaracion);
router.use("/contrato-pdf", routerContratoPDF);
router.use("/recibo-pdf", pagosEmpenos);

//configuraciones ADMIN

router.use('/admin', adminRouter);


module.exports = router;