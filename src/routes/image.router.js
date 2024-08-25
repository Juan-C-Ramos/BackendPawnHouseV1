const { getAll, create, getOne, remove, update } = require('../controllers/image.controller');
const express = require('express');

const routerImage = express.Router();

routerImage.route('/')
    //.get(getAll)
    .post(create);

routerImage.route('/:id')
    //.get(getOne)
    .delete(remove)
    //.put(update);

module.exports = routerImage;