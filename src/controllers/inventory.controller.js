const catchError = require('../utils/catchError');
const Inventory = require('../models/Inventory.js');
const Category = require('../models/Category.js');
const ImageInventory = require('../models/ImageInventory.js');
const Branch = require('../models/Branch.js');
const Transaction = require('../models/Transaction.js');
const Customer = require('../models/Customer.js');





const getAll = catchError(async(req, res) => {
    const results = await Inventory.findAll({include: [Category, ImageInventory, Branch,
        {
            model: Transaction,
            include: [Customer]
        }
    ]});
    return res.json(results);
});


const create = catchError(async(req, res) => {
    const result = await Inventory.create(req.body);
    return res.status(201).json(result);
});

const getOne = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await Inventory.findByPk(id, {include: [Category, ImageInventory, Branch]});
    if(!result) return res.sendStatus(404);
    return res.json(result);
});

const remove = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await Inventory.destroy({ where: {id} });
    if(!result) return res.sendStatus(404);
    return res.sendStatus(204);
});

const update = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await Inventory.update(
        req.body,
        { where: {id}, returning: true }
    );
    if(result[0] === 0) return res.sendStatus(404);
    return res.json(result[1][0]);
});


const setImage = catchError(async(req, res) => {
    const { id } = req.params;
    const inventory = await Inventory.findOne({where: {id}});
    if(!inventory) return res.sendStatus(404);

    await inventory.setImageInventory(req.body)
   //const images = await inventory.getImageInventory();

    return res.status(200).json();
});
const setBillImage = catchError(async(req, res) => {
    const { id } = req.params;
    console.log("error 1")
    const inventory = await Inventory.findOne({where: {id}});
    console.log("error 2")
    if(!inventory) return res.sendStatus(404);
    console.log("error 3")
    
    await inventory.setInventoryBill(req.body)
    console.log("error 4")
    //const images = await inventory.getInventoryBill();
    console.log("error 5")

    return res.status(200).json();
});

//busquedas mas especificas 

//busqueda por isOnSale

const getOnSaleItems = catchError(async (req, res) => {
    const results = await Inventory.findAll({
        where: {
            isOnSale: true
        },
        include: [
            Category,
            ImageInventory,
            Branch,
            {
                model: Transaction,
                include: [Customer]
            }
        ]
    });
    return res.json(results);
});

module.exports = {
    getAll,
    create,
    getOne,
    remove,
    update,
    setImage,
    setBillImage,
    getOnSaleItems
}