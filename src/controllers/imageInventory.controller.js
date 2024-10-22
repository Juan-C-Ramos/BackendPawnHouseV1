const catchError = require('../utils/catchError');
const ImageInventory = require('../models/ImageInventory.js');
const path = require('path');
const fs = require('fs');

const getAll = catchError(async(req, res) => {
    const results = await ImageInventory.findAll();
    return res.json(results);
});

const create = catchError(async(req, res) => {
    console.log(req.file)

    const {filename} = req.file

    const inventoryDB = await ImageInventory.findOne({where: {filename}})

    if (inventoryDB) return res.sendStatus(404).json("Ya Existe el archivo almacenado")
    const url = `${req.protocol}://${req.headers.host}/public/inventoryPhoto/${filename}`
    
    
    const result = await ImageInventory.create({filename, url});
    return res.status(201).json(result);
});


const remove = catchError(async(req, res) => {
    const { id } = req.params;
    
    const result = await ImageInventory.findByPk(id);
    if(!result) return res.sendStatus(404);

    const imagePath = path.join(__dirname, '..', 'public','inventoryPhoto', result.filename);
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