const { getAll, create, getOne, remove, update } = require('../controllers/role.controller.js');
const express = require('express');

const routerRole = express.Router();

routerRole.route('/')
    .get(getAll)
    .post(create);

routerRole.route('/:id')
    .get(getOne)
    .delete(remove)
    .put(update);

module.exports = routerRole;