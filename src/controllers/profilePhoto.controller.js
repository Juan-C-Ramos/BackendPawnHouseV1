const catchError = require('../utils/catchError');
const ProfilPhoto = require('../models/ProfilPhoto.js');
const path = require('path');
const fs = require('fs');

const getAll = catchError(async(req, res) => {
    const results = await ProfilPhoto.findAll();
    return res.json(results);
});

const create = catchError(async(req, res) => {

    const {filename} = req.file

    const inventoryDB = await ProfilPhoto.findOne({where: {filename}})

    if (inventoryDB) return res.sendStatus(404)
    const url = `${req.protocol}://${req.headers.host}/public/profiles/${filename}`
    
    
    const result = await ProfilPhoto.create({filename, url});
    return res.status(201).json(result);
});


const remove = catchError(async(req, res) => {
    const { id } = req.params;
    
    const result = await ProfilPhoto.findByPk(id);
    if(!result) return res.sendStatus(404);

    const imagePath = path.join(__dirname, '..', 'public','profiles', result.filename);
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