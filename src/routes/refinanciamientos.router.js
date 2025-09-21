const { getAll, create, getOne, remove, update } = require('../controllers/refinanciamientos.contoller');
const express = require('express');

const routerRefinanciamientos = express.Router();

routerRefinanciamientos.route('/')
    .get(getAll)
    .post(create);

routerRefinanciamientos.route('/:id')
    .get(getOne)
    .delete(remove)
    .put(update);

module.exports = routerRefinanciamientos;