const catchError = require('../utils/catchError.js');
const path = require('path');
const fs = require('fs');
const IDPhoto = require('../models/IDPhoto.js');
const Customer = require('../models/Customer');

const getAll = catchError(async(req, res) => {
    const results = await IDPhoto.findAll();
    return res.json(results);
});


const create = catchError(async (req, res) => {
  const { filename, url, customerId } = req.body;

  // Validar datos
  if (!filename || !url || !customerId) {
    return res.status(400).json({ message: "Faltan datos obligatorios: filename, url o customerId." });
  }

  // Verificar que el cliente exista
  const customer = await Customer.findByPk(customerId);
  if (!customer) {
    return res.status(404).json({ message: "Cliente no encontrado." });
  }

  // Verificar si ya tiene una foto (según tu relación 1:1)
  const existingPhoto = await IDPhoto.findOne({ where: { customerId } });
  if (existingPhoto) {
    // Si ya tiene, la actualizamos
    existingPhoto.filename = filename;
    existingPhoto.url = url;
    await existingPhoto.save();

    return res.status(200).json({
      message: "🟡 Foto actualizada correctamente.",
      photo: existingPhoto,
    });
  }

  // Crear nueva foto
  const newPhoto = await IDPhoto.create({
    filename,
    url,
    customerId,
  });

  return res.status(201).json({
    message: "✅ Foto guardada correctamente en la base de datos.",
    photo: newPhoto,
  });
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