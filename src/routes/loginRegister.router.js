const { getAll, createRegister, getOne, remove, update } = require('../controllers/loginRegister.controller.js');
const express = require('express');

const routerLoginRegister = express.Router();

routerLoginRegister.route('/')
    .get(getAll)
    .post(createRegister);

routerLoginRegister.route('/:id')
    .get(getOne)
    .delete(remove)
    .put(update);

module.exports = routerLoginRegister;