const { getAll, create, remove } = require('../controllers/idPhoto.controller.js');
const express = require('express');
const {  upload_IdPhoto } = require('../utils/multer');

const routerIdPhoto = express.Router();

routerIdPhoto.route('/')
    .get(getAll)
    .post(upload_IdPhoto.single('image'), create);
    
    



    routerIdPhoto.route('/:id')
    //.get(getOne)
    .delete(remove)
    //.put(update);
    

module.exports = routerIdPhoto;