const catchError = require('../utils/catchError');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment.js');
const Contract = require('../models/Contract.js');
const ProofOfServices = require('../models/ProofOfServices.js');
const InventoryBill = require('../models/InventoryBill.js');
const Inventory = require('../models/Inventory.js');
const Category = require('../models/Category.js');
const Branch = require('../models/Branch.js');
const User = require('../models/User.js');
const Customer = require('../models/Customer.js');
const Role = require('../models/Role.js');
const Cuote = require('../models/Cuote.js');

const getAll = catchError(async(req, res) => {
    const results = await Transaction.findAll({include: [Contract, Customer, 
        {
            model: User,
            include: [Role], // Incluye el modelo Role
            attributes: { exclude: ['password'] } // Excluye el campo password
        },
        {
            model: Inventory,
            include: [Category, Branch]
        },
        {
            model: Payment,
            include: [Cuote]
        },
        {
            model: Cuote,
            as: "transactionCuotes"
        }
    ]});
    return res.json(results);
});

const create = catchError(async(req, res) => {
    const result = await Transaction.create(req.body);
    return res.status(201).json(result);
});

const getOne = catchError(async (req, res) => {
    const { id } = req.params;
    const result = await Transaction.findByPk(id, {include: [Payment, Contract ,
        {
            model: Inventory,
            include: [Category, Branch]
        },
        {
            model: Cuote,
            as: "transactionCuotes"
        }

    ]});
    console.log(result);
    if (!result) return res.sendStatus(404);
    return res.json(result);
});

const remove = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await Transaction.destroy({ where: {id} });
    if(!result) return res.sendStatus(404);
    return res.sendStatus(204);
});

const update = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await Transaction.update(
        req.body,
        { where: {id}, returning: true }
    );
    if(result[0] === 0) return res.sendStatus(404);
    return res.json(result[1][0]);
});

const setContract = catchError(async(req, res) => {
    const { id } = req.params;
    const transaction = await Transaction.findByPk(id);
    if(!transaction) return res.sendStatus(404);

    await transaction.setContracts(req.body)
    const images = await transaction.getContracts();

    return res.status(200).json(images);
});




const setInventoryBill = catchError(async(req, res) => {
    const { id } = req.params;
    const transaction = await Transaction.findByPk(id);
    if(!transaction) return res.sendStatus(404);

    await transaction.setImageInventoryBills(req.body)
    const images = await transaction.getImageInventoryBills();

    return res.status(200).json(images);
});

const setCuote = catchError(async(req, res) => {
    const { id } = req.params;
    const transaction = await Transaction.findByPk(id);
    if(!transaction) return res.sendStatus(404);
    await transaction.setTransactionCuotes(req.body)
    const cuotes = await transaction.getTransactionCuotes();
    return res.status(200).json(cuotes);
})



module.exports = {
    getAll,
    create,
    getOne,
    remove,
    update, 
    setContract,
    setInventoryBill,
    setCuote
}