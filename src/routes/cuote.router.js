const { getAll, create, getOne, remove, update, getUpcomingCuotes, getPaidCuotes, getOverdueCuotes } = require('../controllers/cuote.controller');
const express = require('express');

const routerCuote = express.Router();

routerCuote.route('/')
    .get(getAll)
    .post(create);

routerCuote.route('/overdue')
    .get(getOverdueCuotes);

routerCuote.route('/paid')
    .get( getPaidCuotes);

routerCuote.route('/upcoming',)
    .get(getUpcomingCuotes);

routerCuote.route('/:id')
    .get(getOne)
    .delete(remove)
    .put(update);

module.exports = routerCuote;