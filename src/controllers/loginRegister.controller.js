const catchError = require('../utils/catchError');
const LoginRegister = require('../models/LoginRegister');
const { where } = require('sequelize');

const getAll = catchError(async(req, res) => {
    const results = await LoginRegister.findAll();
    return res.json(results);
});

const createRegister = catchError(async(req, res) => {
    const result = await LoginRegister.create(req.body);
    return res.status(201).json(result);
});

const getOne = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await LoginRegister.findAll({where: { id: idUser}});
    if(!result) return res.sendStatus(404);
    return res.json(result);
});

const remove = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await LoginRegister.destroy({ where: {id} });
    if(!result) return res.sendStatus(404);
    return res.sendStatus(204);
});

const update = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await LoginRegister.update(
        req.body,
        { where: {id}, returning: true }
    );
    if(result[0] === 0) return res.sendStatus(404);
    return res.json(result[1][0]);
});

module.exports = {
    getAll,
    createRegister,
    getOne,
    remove,
    update
}                   