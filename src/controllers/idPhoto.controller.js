const catchError = require('../utils/catchError.js');
const path = require('path');
const fs = require('fs');
const IDPhoto = require('../models/IDPhoto.js');

const getAll = catchError(async(req, res) => {
    const results = await IDPhoto.findAll();
    return res.json(results);
});

const create = catchError(async(req, res) => {
    console.log(req)
    const {filename} = req.file

    const photoIDDB = await IDPhoto.findOne({where: {filename}})
    console.log(photoIDDB)

    if (photoIDDB) return res.sendStatus(404)
    const url = `${req.protocol}://${req.headers.host}/public/idPhoto/${filename}`
    
    
    const result = await IDPhoto.create({filename, url});
    return res.status(201).json(result);
});


const remove = catchError(async(req, res) => {
    const { id } = req.params;
    
    const result = await IDPhoto.findByPk(id);
    if(!result) return res.sendStatus(404);

    const imagePath = path.join(__dirname, '..', 'public','idPhoto', result.filename);
    console.log(imagePath);
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