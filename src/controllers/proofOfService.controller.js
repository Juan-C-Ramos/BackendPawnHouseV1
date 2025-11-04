const catchError = require('../utils/catchError');
const ProofOfService = require('../models/ProofOfServices.js');
const path = require('path');
const fs = require('fs');

const getAll = catchError(async(req, res) => {
    const results = await ProofOfService.findAll();
    return res.json(results);
});

const ProofOfServices = require('../models/ProofOfServices');
const Customer = require('../models/Customer');

const create = catchError(async (req, res) => {
  const { filename, url, customerId } = req.body;

  // Validar datos obligatorios
  if (!filename || !url || !customerId) {
    return res.status(400).json({ message: "Faltan datos obligatorios: filename, url o customerId." });
  }

  // Verificar si el cliente existe
  const customer = await Customer.findByPk(customerId);
  if (!customer) {
    return res.status(404).json({ message: "Cliente no encontrado." });
  }

  // Verificar si ya tiene una prueba de servicio registrada
  const existingProof = await ProofOfServices.findOne({ where: { customerId } });
  if (existingProof) {
    existingProof.filename = filename;
    existingProof.url = url;
    await existingProof.save();

    return res.status(200).json({
      message: "🟡 Prueba de servicio actualizada correctamente.",
      proof: existingProof,
    });
  }

  // Crear nueva prueba
  const newProof = await ProofOfServices.create({
    filename,
    url,
    customerId,
  });

  return res.status(201).json({
    message: "✅ Prueba de servicio guardada correctamente en la base de datos.",
    proof: newProof,
  });
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