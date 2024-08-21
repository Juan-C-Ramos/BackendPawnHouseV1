const { getAll, create, getOne, remove, update } = require('../controllers/mainData.controller.js');
const express = require('express');
const { verifyJwt } = require('../utils/verifyJWT');

const routerMainData = express.Router();

routerMainData.route('/')
    .get(verifyJwt, getAll)
    .post(verifyJwt, create);

routerMainData.route('/:id')
    .get(verifyJwt, getOne)
    .delete(verifyJwt, remove)
    .put(verifyJwt, update);

module.exports = routerMainData;