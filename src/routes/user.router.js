const { getAll, create, getOne, remove, update, login ,logged} = require('../controllers/user.controller.js');
const express = require('express');
const { verifyJwt } = require('../utils/verifyJWT');

const routerUser = express.Router();

routerUser.route('/')
  .get(verifyJwt, getAll) //🔐
  .post(create); //🔐

routerUser.route('/login') // /users/login
  .post(login)

routerUser.route('/me') // /users/me
  .get(verifyJwt, logged) //🔐

routerUser.route('/:id')
  .get(verifyJwt, getOne) //🔐
  .delete(verifyJwt, remove) //🔐
  .put(verifyJwt, update); //🔐

module.exports = routerUser; 