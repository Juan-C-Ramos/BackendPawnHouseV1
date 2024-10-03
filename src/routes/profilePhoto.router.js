const { getAll, create, remove } = require('../controllers/profilePhoto.controller');
const express = require('express');
const { upload_Profile } = require('../utils/multer');

const routerProfilePhoto = express.Router();

routerProfilePhoto.route('/')
    .get(getAll)
    .post(upload_Profile.single('image'), create);

routerProfilePhoto.route('/:id')
    //.get(getOne)
    .delete(remove)
    //.put(update);
    

module.exports = routerProfilePhoto;