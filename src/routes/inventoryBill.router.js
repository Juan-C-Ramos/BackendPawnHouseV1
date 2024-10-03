const { getAll, create, remove } = require('../controllers/inventoryBill.controller');
const express = require('express');
const { upload_InventoryBill } = require('../utils/multer');

const routerInventoryBill = express.Router();

routerInventoryBill.route('/')
    .get(getAll)
    .post(upload_InventoryBill.single('image'), create);
    
    



routerInventoryBill.route('/:id')
    //.get(getOne)
    .delete(remove)
    //.put(update);
    

module.exports = routerInventoryBill;