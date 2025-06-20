const catchError = require("../utils/catchError");
const Transaction = require("../models/Transaction");
const Payment = require("../models/Payment.js");
const Contract = require("../models/Contract.js");
const ProofOfServices = require("../models/ProofOfServices.js");
const InventoryBill = require("../models/InventoryBill.js");
const Inventory = require("../models/Inventory.js");
const Category = require("../models/Category.js");
const Branch = require("../models/Branch.js");
const User = require("../models/User.js");
const Customer = require("../models/Customer.js");
const Role = require("../models/Role.js");
const Cuote = require("../models/Cuote.js");

const getAll = catchError(async (req, res) => {
  const results = await Transaction.findAll({
    include: [
      Contract,
      Customer,
      {
        model: User,
        include: [Role], // Incluye el modelo Role
        attributes: { exclude: ["password"] }, // Excluye el campo password
      },
      {
        model: Inventory,
        include: [Category, Branch],
      },
      {
        model: Payment,
        include: [Cuote],
      },
      {
        model: Cuote,
        as: "transactionCuotes",
      },
    ],
  });

  return res.json(results);
});
const getIdContract = catchError(async (req, res) => {
  const results = await Transaction.findAll();
  const IdContract = results.length + 1;

  return res.json(IdContract);
});

const create = catchError(async (req, res) => {
  const result = await Transaction.create(req.body);

  const id = result.id;
  const resultComplete = await Transaction.findByPk(id, {
    include: [
      Contract,
      Customer,
      {
        model: User,
        include: [Role], // Incluye el modelo Role
        attributes: { exclude: ["password"] }, // Excluye el campo password
      },
      {
        model: Inventory,
        include: [Category, Branch],
      },
      {
        model: Payment,
        include: [Cuote],
      },
      {
        model: Cuote,
        as: "transactionCuotes",
      },
    ],
  });

  return res.json(resultComplete);

  //return res.status(201).json(result);
});

const getOne = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await Transaction.findByPk(id, {
    include: [
      Contract,
      Customer,
      {
        model: User,
        include: [Role], // Incluye el modelo Role
        attributes: { exclude: ["password"] }, // Excluye el campo password
      },
      {
        model: Inventory,
        include: [Category, Branch],
      },
      {
        model: Payment,
        include: [Cuote],
      },
      {
        model: Cuote,
        as: "transactionCuotes",
      },
    ],
  });
  console.log(result);
  if (!result) return res.sendStatus(404);
  return res.json(result);
});

const remove = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await Transaction.destroy({ where: { id } });
  if (!result) return res.sendStatus(404);
  return res.sendStatus(204);
});

const update = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await Transaction.update(req.body, {
    where: { id },
    returning: true,
  });
  if (result[0] === 0) return res.sendStatus(404);
  return res.json(result[1][0]);
});

const setContract = catchError(async (req, res) => {
  const { id } = req.params;
  const transaction = await Transaction.findByPk(id);
  if (!transaction) return res.sendStatus(404);

  await transaction.setContracts(req.body);
  const images = await transaction.getContracts();

  return res.status(200).json(images);
});

const setInventoryBill = catchError(async (req, res) => {
  const { id } = req.params;
  const transaction = await Transaction.findByPk(id);
  if (!transaction) return res.sendStatus(404);

  await transaction.setImageInventoryBills(req.body);
  const images = await transaction.getImageInventoryBills();

  return res.status(200).json(images);
});

// const setCuote = catchError(async(req, res) => {
//     const { id } = req.params;
//     const transaction = await Transaction.findByPk(id);
//     if(!transaction) return res.sendStatus(404);
//     await transaction.setTransactionCuotes(req.body)
//     const cuotes = await transaction.getTransactionCuotes();
//     return res.status(200).json(cuotes);
// })

const setCuote = catchError(async (req, res) => {
  const { id } = req.params;
  const transaction = await Transaction.findByPk(id);
  if (!transaction) return res.sendStatus(404);

  const existingCuotes = await transaction.getTransactionCuotes();
  const newCuotes = req.body;

  // Añadir las nuevas cuotas a las existentes usando push
  existingCuotes.push(...newCuotes);

  await transaction.setTransactionCuotes(existingCuotes);
  const cuotes = await transaction.getTransactionCuotes();
  return res.status(200).json(cuotes);
});

const getPrestamosTransactions = async (req, res) => {
  try {
    const prestamosTransactions = await Transaction.findAll({
      where: {
        transactionType: "prestamos",
      },
      include: [
        Contract,
        Customer,
        {
          model: User,
          include: [Role],
          attributes: { exclude: ["password"] },
        },
        {
          model: Inventory,
          include: [Category, Branch],
        },
        {
          model: Payment,
          include: [Cuote],
        },
        {
          model: Cuote,
          as: "transactionCuotes",
        },
      ],
    });
    return res.status(200).json(prestamosTransactions);
  } catch (error) {
    console.error("Error al obtener transacciones de prestamos:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener transacciones de prestamos" });
  }
};

const getVentasTransactions = async (req, res) => {
  try {
    const ventasTransactions = await Transaction.findAll({
      where: {
        transactionType: "venta",
      },
      include: [
        Contract,
        Customer,
        {
          model: User,
          include: [Role],
          attributes: { exclude: ["password"] },
        },
        {
          model: Inventory,
          include: [Category, Branch],
        },
        {
          model: Payment,
          include: [Cuote],
        },
        {
          model: Cuote,
          as: "transactionCuotes",
        },
      ],
    });
    return res.status(200).json(ventasTransactions);
  } catch (error) {
    console.error("Error al obtener transacciones de venta:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener transacciones de venta" });
  }
};

const getEmpeñoTransactions = async (req, res) => {
  try {
    const empeñoTransactions = await Transaction.findAll({
      where: {
        transactionType: "empeño",
      },
      include: [
        Contract,
        Customer,
        {
          model: User,
          include: [Role],
          attributes: { exclude: ["password"] },
        },
        {
          model: Inventory,
          include: [Category, Branch],
        },
        {
          model: Payment,
          include: [Cuote],
        },
        {
          model: Cuote,
          as: "transactionCuotes",
        },
      ],
    });
    return res.status(200).json(empeñoTransactions);
  } catch (error) {
    console.error("Error al obtener transacciones de empeño:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener transacciones de empeño" });
  }
};

const createManyContracts = catchError(async (req, res) => {
  const data = req.body;

  // 🛡️ 1. Verificar que se envió un array no vacío
  if (!Array.isArray(data) || data.length === 0) {
    return res
      .status(400)
      .json({ message: "Se requiere un array con contratos" });
  }

  // 🧠 2. Extraer todas las cédulas del array original
  const cedulas = data.map((d) => d.cedula);

  // 🚀 3. Buscar todos los clientes con esas cédulas en una sola consulta (más rápido)
  const customers = await Customer.findAll({
    where: { numberID: cedulas },
  });

  // 🔁 4. Crear un mapa de { cedula: customerId } para consulta rápida
  const customerMap = {};
  customers.forEach((c) => {
    customerMap[c.numberID] = c.id;
  });

  // 🧱 5. Armar nuevo array con customerId y los demás campos necesarios
  const transformedContracts = [];

  for (const contract of data) {
    const customerId = customerMap[contract.cedula];

    // ❌ Si no se encuentra el cliente por cédula, se devuelve error
    if (!customerId) {
      return res.status(404).json({
        message: `No se encontró un cliente con la cédula: ${contract.cedula}`,
      });
    }

    // ✅ Desestructurar los demás campos del contrato
    const {
      contractNumber,
      interestsPorcent,
      amonunt,
      morosidadAmount,
      cuotesAmount,
      balance,
      capital,
      transctionType,
      interestsType,
    } = contract;

    // 🗓️ Asignar fechas fijas porque no vienen en los datos originales
    const startDate = "2025-05-31";
    const nextPaymentDate = "2025-06-15";

    // ➕ Construir el nuevo objeto con customerId en lugar de cedula
    transformedContracts.push({
      customerId,
      contractNumber,
      interestsPorcent,
      amonunt,
      morosidadAmount,
      cuotesAmount,
      balance,
      capital,
      transctionType,
      startDate,
      nextPaymentDate,
      interestsType,
    });
  }

  // 💾 6. Crear todos los contratos en la base de datos con una sola operación
  const created = await Contract.bulkCreate(transformedContracts, {
    validate: true,
  });

  // 📤 7. Responder con los contratos creados
  return res.status(201).json(created);
});

module.exports = {
  getAll,
  create,
  getOne,
  remove,
  update,
  setContract,
  setInventoryBill,
  setCuote,
  getPrestamosTransactions,
  getVentasTransactions,
  getEmpeñoTransactions,
  getIdContract,
  createManyContracts
};
