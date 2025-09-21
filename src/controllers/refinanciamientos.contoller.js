const catchError = require('../utils/catchError');
const Refinanciamientos = require('../models/Refinanciamientos');
const Transactions = require('../models/Transaction');

const getAll = catchError(async (req, res) => {
    const results = await Refinanciamientos.findAll();
    return res.json(results);
});

const create = catchError(async (req, res) => {
    const { contratosRefinanciados, ...restContrato } = req.body;

    // 1. Crear primero el contrato nuevo en Transactions
    const nuevoContrato = await Transactions.create({
        ...restContrato
    });

    // 2. Generar numeroContrato con formato AÑO-ID padded
    const year = new Date().getFullYear();
    const paddedId = String(nuevoContrato.id).padStart(7, "0");
    const numeroContrato = `${year}-${paddedId}`;

    // 3. Actualizar el contrato con su numeroContrato
    console.log(nuevoContrato.id, numeroContrato);
    await Transactions.update({ contractNumber:numeroContrato }, { where: { id: nuevoContrato.id } });

    // 4. Marcar los contratos refinanciados
    if (Array.isArray(contratosRefinanciados) && contratosRefinanciados.length > 0) {
        await Transactions.update(
            { status: "refinanciado", transactionType: "prestamo refinanciado" },
            { where: { id: contratosRefinanciados } }
        );
    }

    // 5. Crear el registro en Refinanciamientos
    const refinanciamiento = await Refinanciamientos.create({
        numeroContrato: nuevoContrato.id,              // el número del contrato nuevo
        contratosRefinanciados: contratosRefinanciados // guardado como string/array
    });

    return res.status(201).json({
        contratoNuevo: nuevoContrato,
        refinanciamiento
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
