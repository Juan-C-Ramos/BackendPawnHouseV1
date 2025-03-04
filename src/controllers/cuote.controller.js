const catchError = require('../utils/catchError');
const Cuote = require('../models/Cuote.js');
const { Op } = require('sequelize');

const getAll = catchError(async(req, res) => {
    const results = await Cuote.findAll();
    return res.json(results);
});

const create = catchError(async(req, res) => {
    const result = await Cuote.bulkCreate(req.body);
    console.log(result);
    return res.status(201).json(result);
});

const getOne = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await Cuote.findByPk(id);
    if(!result) return res.sendStatus(404);
    return res.json(result);
});

const remove = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await Cuote.destroy({ where: {id} });
    if(!result) return res.sendStatus(404);
    return res.sendStatus(204);
});

const update = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await Cuote.update(
        req.body,
        { where: {id}, returning: true }
    );
    if(result[0] === 0) return res.sendStatus(404);
    return res.json(result[1][0]);
});

const getOverdueCuotes = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const overdueCuotes = await Cuote.findAll({
            where: {
                paymentCutDate: {
                    [Op.lt]: today
                }
            }
        });
        return res.status(200).json(overdueCuotes);
    } catch (error) {
        console.error('Error al obtener cuotas vencidas:', error);
        return res.status(500).json({ message: 'Error al obtener cuotas vencidas' });
    }
};
const getPaidCuotes = async (req, res) => {
    try {
        const paidCuotes = await Cuote.findAll({
            where: {
                status: 'paid'
            }
        });
        return res.status(200).json(paidCuotes);
    } catch (error) {
        console.error('Error al obtener cuotas pagadas:', error);
        return res.status(500).json({ message: 'Error al obtener cuotas pagadas' });
    }
};
const getUpcomingCuotes = async (req, res) => {
    try {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        const upcomingCuotes = await Cuote.findAll({
            where: {
                paymentCutDate: {
                    [Op.between]: [today.toISOString().split('T')[0], nextWeek.toISOString().split('T')[0]]
                }
            }
        });
        return res.status(200).json(upcomingCuotes);
    } catch (error) {
        console.error('Error al obtener cuotas próximas:', error);
        return res.status(500).json({ message: 'Error al obtener cuotas próximas' });
    }
};

module.exports = {
    getAll,
    create,
    getOne,
    remove,
    update,
    getOverdueCuotes,
    getPaidCuotes,
    getUpcomingCuotes

}