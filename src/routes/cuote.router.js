const { getAll, create, getOne, remove, update } = require('../controllers/cuote.controller');
const express = require('express');

const routerCuote = express.Router();

routerCuote.route('/')
    .get(getAll)
    .post(create);

routerCuote.route('/:id')
    .get(getOne)
    .delete(remove)
    .put(update);

module.exports = routerCuote;