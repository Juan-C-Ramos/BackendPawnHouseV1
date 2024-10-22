const catchError = require('../utils/catchError');
const InventoryBill = require('../models/InventoryBill.js');
const path = require('path');
const fs = require('fs');

const getAll = catchError(async(req, res) => {
    const results = await InventoryBill.findAll();
    return res.json(results);
});

const create = catchError(async(req, res) => {
    console.log(req)

    const {filename} = req.file

    const inventoryBillDB = await InventoryBill.findOne({where: {filename}})

    if (inventoryBillDB) return res.status(404).json({ message: 'Ya existe un archivo con ese nombre.' });
    
    const url = `${req.protocol}://${req.headers.host}/public/inventoryBill/${filename}`
    
    
    const result = await InventoryBill.create({filename, url});
    return res.status(201).json(result);
});


const remove = catchError(async(req, res) => {
    const { id } = req.params;
    
    const result = await InventoryBill.findByPk(id);
    if(!result) return res.sendStatus(404);

    const imagePath = path.join(__dirname, '..', 'public','inventoryBill', result.filename);
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