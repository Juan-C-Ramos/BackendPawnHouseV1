const { getAll, create, getOne, remove, update } = require('../controllers/branch.controller');
const express = require('express');

const routerBranch = express.Router();

routerBranch.route('/')
    .get(getAll)
    .post(create);

routerBranch.route('/:id')
    .get(getOne)
    .delete(remove)
    .put(update);

module.exports = routerBranch;