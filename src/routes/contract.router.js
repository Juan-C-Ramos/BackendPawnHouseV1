const { getAll, create, remove } = require('../controllers/contract.controller');
const express = require('express');
const { upload_Contract } = require('../utils/multer');

const routerContract = express.Router();

routerContract.route('/')
    .get(getAll)
    .post(upload_Contract.single('image'), create);
    
    



routerContract.route('/:id')
    //.get(getOne)
    .delete(remove)
    //.put(update);
    

module.exports = routerContract;