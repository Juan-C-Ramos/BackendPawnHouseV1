const { getAll, create, remove } = require('../controllers/imageInventory.controller');
const express = require('express');
const { upload_InventoryPhoto } = require('../utils/multer');

const routerImageInventory = express.Router();

routerImageInventory.route('/')
    .get(getAll)
    .post(upload_InventoryPhoto.single('image'), create);
    
    



routerImageInventory.route('/:id')
    //.get(getOne)
    .delete(remove)
    //.put(update);
    

module.exports = routerImageInventory;