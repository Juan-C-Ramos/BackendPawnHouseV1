const { getAll, create, getOne, remove, update, setProofOfService, setIdPhoto, setUser} = require('../controllers/customer.controller.js');
const express = require('express');
const { verifyJwt } = require('../utils/verifyJWT');

const routerCustomer = express.Router();

routerCustomer.route('/')
    .get( getAll)
    .post( create);

routerCustomer.route('/:id/proofOfService')
    .post(setProofOfService);

routerCustomer.route('/:id/idPhoto')
    .post(setIdPhoto);

routerCustomer.route('/:id/user')
    .post(setUser);

routerCustomer.route('/:id')
    .get( getOne)
    .delete( remove)
    .put( update);

module.exports = routerCustomer;