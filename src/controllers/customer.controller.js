const catchError = require('../utils/catchError');
const Customer = require('../models/Customer.js');
const IDPhoto = require('../models/IDPhoto.js');
const ProofOfServices = require('../models/ProofOfServices.js');
const User = require('../models/User.js');
const Role = require('../models/Role.js');
const Transaction = require('../models/Transaction.js');
const Inventory = require('../models/Inventory.js');
const Branch = require('../models/Branch.js');
const Payment = require('../models/Payment.js');
const Cuote = require('../models/Cuote.js');

//const getAll = catchError(async(req, res) => {
  //  const results = await Customer.findAll({include: [IDPhoto, ProofOfServices, User]});
//    return res.json(results);
//});

//as: "transactionCuotes"

const getAll = catchError(async (req, res) => {
    const results = await Customer.findAll({
        include: [
            IDPhoto,
            ProofOfServices,
            
            {
                model: Transaction,
                include: [Payment,
                    {
                        model: Cuote,
                        as: "transactionCuotes"
                    },
                    {
                        model: User,
                        include: [Role], // Incluye el modelo Role
                        attributes: { exclude: ['password'] } // Excluye el campo password
                    }
                ]
            },
            {
                model: User,
                include: [Role], // Incluye el modelo Role
                attributes: { exclude: ['password'] } // Excluye el campo password
            }
        ]
    })
    return res.json(results);});

//const create = catchError(async(req, res) => {
  //  const result = await Customer.create(req.body);
    //return res.status(201).json(result);
//});

const create = catchError(async (req, res) => {
    const result = await Customer.create(req.body);

    // Vuelve a consultar el Customer recién creado con sus asociaciones
    const customerWithAssociations = await Customer.findByPk(result.id, {
        include: [IDPhoto, ProofOfServices, {
            model: User,
            include: [Role], // Incluye el modelo Role
            attributes: { exclude: ['password'] } // Excluye el campo password
        }]
    });
    return res.status(201).json(customerWithAssociations);
});

const bulkCreate = catchError(async (req, res) => {


  // Insertar en bloque
  const createdCustomers = await Customer.bulkCreate(req.body);

  return res.status(201).json(createdCustomers);
});


const getOne = catchError(async(req, res) => {
    const { id } = req.params;
    const customerWithAssociations = await Customer.findByPk(id, {
        include: [IDPhoto, ProofOfServices, {
            model: User,
            include: [Role], // Incluye el modelo Role
            attributes: { exclude: ['password'] } // Excluye el campo password
        }]
    });
    return res.status(200).json(customerWithAssociations);
});

const remove = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await Customer.destroy({ where: {id} });
    if(!result) return res.sendStatus(404);
    return res.sendStatus(204);
});

const update = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await Customer.update(
        req.body,
        { where: {id}, returning: true }
    );
    if(result[0] === 0) return res.sendStatus(404);
    return res.json(result[1][0]);
});

const setProofOfService = catchError(async(req, res) => {
    const { id } = req.params;
    const customer = await Customer.findByPk(id);
    if(!customer) return res.sendStatus(404);

    await customer.setProofOfService(req.body)
    const images = await customer.getProofOfService();

    return res.status(200).json(images);
});

const setIdPhoto = catchError(async(req, res) => {
    const { id } = req.params;
    const customer = await Customer.findByPk(id);
    if(!customer) return res.sendStatus(404);

    await customer.setIdPhoto(req.body)
    const images = await customer.getIdPhoto();

    return res.status(200).json(images);
});

const setUser = catchError(async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer.findByPk(Number(id));
        if (!customer) return res.sendStatus(404);

        await customer.setUser(req.body);
        const images = await customer.getUser();

        return res.status(200).json(images);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = {
    getAll,
    create,
    getOne,
    remove,
    update,
    setProofOfService,
    setIdPhoto,
    setUser,
    bulkCreate
}