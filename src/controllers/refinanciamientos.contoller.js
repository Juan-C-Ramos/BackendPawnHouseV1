const catchError = require('../utils/catchError');
const Refinanciamientos = require('../models/Refinanciamientos');
const Transactions = require('../models/Transaction');
const { Op } = require('sequelize');
const Customer = require('../models/Customer');

const getAll = catchError(async (req, res) => {
    const results = await Refinanciamientos.findAll();
    return res.json(results);
});

const create = catchError(async (req, res) => {
    const { contratosRefinanciados, ...restContrato } = req.body;

    // 1. Crear contrato nuevo
    const nuevoContrato = await Transactions.create({
        ...restContrato
    });

    // 2. Generar número de contrato
    const year = new Date().getFullYear();
    const paddedId = String(nuevoContrato.id).padStart(7, "0");
    const numeroContrato = `${year}-${paddedId}`;

    console.log(nuevoContrato.id, numeroContrato);

    // 3. Actualizar contrato y obtenerlo actualizado
    const [_, [updatedContrato]] = await Transactions.update(
        { contractNumber: numeroContrato },
        {
            where: { id: nuevoContrato.id },
            returning: true,
        }
    );

    // 4. IDs refinanciados
    const contratosIds = Array.isArray(contratosRefinanciados)
        ? contratosRefinanciados.map(c => c.id)
        : [];

    // 5. Marcar refinanciados
    if (contratosIds.length > 0) {
        await Transactions.update(
            {
                status: "refinanciado",
                transactionType: "prestamo refinanciado",
            },
            {
                where: { id: contratosIds },
            }
        );
    }

    // 6. Refinanciamiento
    const refinanciamiento = await Refinanciamientos.create({
        numeroContrato: nuevoContrato.id,
        contratosRefinanciados: contratosIds,
    });

    // 7. Cliente
    const cliente = await Customer.findByPk(nuevoContrato.customerId);

    return res.status(201).json({
        contratoNuevo: updatedContrato,
        refinanciamiento,
        cliente,
    });
});

const getOne = catchError(async (req, res) => {
    const { id } = req.params;
    const result = await Refinanciamientos.findByPk(id);
    if (!result) return res.sendStatus(404);
    return res.json(result);
});

const remove = catchError(async (req, res) => {
    const { id } = req.params;
    const result = await Refinanciamientos.destroy({ where: { id } });
    if (!result) return res.sendStatus(404);
    return res.sendStatus(204);
});

const update = catchError(async (req, res) => {
    const { id } = req.params;
    const result = await Refinanciamientos.update(
        req.body,
        { where: { id }, returning: true }
    );
    if (result[0] === 0) return res.sendStatus(404);
    return res.json(result[1][0]);
});

module.exports = {
    getAll,
    create,
    getOne,
    remove,
    update
};
