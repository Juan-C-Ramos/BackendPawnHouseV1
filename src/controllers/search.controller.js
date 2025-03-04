const catchError = require('../utils/catchError');
const Customer = require('../models/Customer.js');

const getAll = catchError(async(req, res) => {
    return res.json(/* valor a retornar */)
});

module.exports = {
    getAll
}