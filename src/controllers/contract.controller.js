const catchError = require('../utils/catchError');
const Contract = require('../models/Contract.js');
const path = require('path');
const fs = require('fs');
const uploadToDrive = require('../utils/driveUploader');
const Transaction = require('../models/Transaction.js');

// Reemplaza esto por tu ID real de la carpeta en Drive
const DRIVE_FOLDER_ID = '1HIlIKTnbIdaXlNGQxtjR_nnUQf4s5YtS';

const getAll = catchError(async (req, res) => {
    const results = await Contract.findAll();
    return res.json(results);
});


const create = catchError(async (req, res) => {

  const contractNumber= req.body[0];
    const url = req.body[1];
    const transactionId = req.body[2];
  console.log('Datos del contrato:', { contractNumber, url, transactionId });

  if (!contractNumber || !url || !transactionId) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  // Evita duplicados por filename
//   const existingContract = await Contract.findOne({ where: { filename: contractNumber } });
//   if (existingContract) {
//     return res.status(409).json({ error: 'Ya existe un contrato con ese número' });
//   }

  // Crear el contrato
  const newContract = await Contract.create({
    filename: contractNumber,
    url,
    transactionId
  });

  // Buscar la transacción
  const transaction = await Transaction.findByPk(transactionId);
  if (!transaction) {
    return res.status(404).json({ error: 'Transacción no encontrada' });
  }

  // Asegurarse de que contracts es un array (si estás usando JSON en Sequelize o una tabla intermedia)
  let currentContracts = transaction.contracts || [];

  // Si contracts se guarda como JSON en un campo de tipo ARRAY o TEXT en Sequelize:
  if (!Array.isArray(currentContracts)) {
    currentContracts = [];
  }

  currentContracts.push(newContract.id);

  // Actualizar la transacción
  await transaction.update({ contracts: currentContracts });

  return res.status(201).json({
    message: 'Contrato creado y asociado exitosamente',
    contract: newContract,
    updatedTransaction: transaction
  });
});


const remove = catchError(async (req, res) => {
    const { id } = req.params;

    const result = await Contract.findByPk(id);
    if (!result) return res.sendStatus(404);

    // Aquí podrías también eliminar el archivo de Drive si guardas el fileId
    await result.destroy();

    return res.sendStatus(204);
});

module.exports = {
    getAll,
    create,
    remove,
};
