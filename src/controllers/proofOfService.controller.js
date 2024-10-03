const catchError = require('../utils/catchError');
const ProofOfService = require('../models/ProofOfServices.js');
const path = require('path');
const fs = require('fs');

const getAll = catchError(async(req, res) => {
    const results = await ProofOfService.findAll();
    return res.json(results);
});

const create = catchError(async(req, res) => {

    const {filename} = req.file

    const proofOfServiceDB = await ProofOfService.findOne({where: {filename}})

    if (proofOfServiceDB) return res.sendStatus(404)
    const url = `${req.protocol}://${req.headers.host}/public/proofOfService/${filename}`
    
    
    const result = await ProofOfService.create({filename, url});
    return res.status(201).json(result);
});


const remove = catchError(async(req, res) => {
    const { id } = req.params;
    
    const result = await ProofOfService.findByPk(id);
    if(!result) return res.sendStatus(404);

    const imagePath = path.join(__dirname, '..', 'public','proofOfService', result.filename);
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