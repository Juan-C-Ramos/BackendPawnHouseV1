const catchError = require('../utils/catchError');
const Contract = require('../models/Contract.js');
const path = require('path');
const fs = require('fs');

const getAll = catchError(async(req, res) => {
    const results = await Contract.findAll();
    return res.json(results);
});

const create = catchError(async(req, res) => {

    const {filename} = req.file

    const contractDB = await Contract.findOne({where: {filename}})

    if (contractDB) return res.sendStatus(404)
    const url = `${req.protocol}://${req.headers.host}/public/contract/${filename}`
    
    
    const result = await Contract.create({filename, url});
    return res.status(201).json(result);
});


const remove = catchError(async(req, res) => {
    const { id } = req.params;
    
    const result = await Contract.findByPk(id);
    if(!result) return res.sendStatus(404);

    const imagePath = path.join(__dirname, '..', 'public','contract', result.filename);
    //console.log(imagePath);
    //console.log(result.filename);
    fs.unlinkSync(imagePath)
    await result.destroy();
    
    
    return res.sendStatus(204);
});



module.exports = {
    getAll,
    create,
    remove,
  
}