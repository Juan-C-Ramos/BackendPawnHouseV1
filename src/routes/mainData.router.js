const { getAll, create, getOne, remove, update } = require('../controllers/mainData.controller.js');
const express = require('express');
const { verifyJwt } = require('../utils/verifyJWT');

const routerMainData = express.Router();

routerMainData.route('/')
    .get( getAll)
    .post( create);

routerMainData.route('/:id')
    .get( getOne)
    .delete( remove)
    .put( update);

module.exports = routerMainData;