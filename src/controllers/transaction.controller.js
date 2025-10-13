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


const HistorialSaldo = require("../models/HistorialSaldo");
const { Op } = require("sequelize");


const getAll = catchError(async (req, res) => {
  // Traer todas las transacciones y sus relaciones
  const results = await Transaction.findAll({
    order: [['id', 'ASC']],
    include: [
      Contract,
      Customer,
      {
        model: User,
        include: [Role],
        attributes: { exclude: ['password'] },
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
        as: 'transactionCuotes',
      },
    ],
  });

  // Traer todos los historiales
  const historiales = await HistorialSaldo.findAll();

  // Traer las relaciones PaymentUsers y los usuarios
  const paymentUsers = await PaymentUsers.findAll();
  const users = await User.findAll({
    include: [Role],
    attributes: { exclude: ['password'] },
  });

  // Crear mapas
  const historialMap = {};
  historiales.forEach(h => {
    historialMap[h.pagoId] = h;
  });

  const userMap = {};
  users.forEach(u => {
    userMap[u.id] = u.toJSON();
  });

  const paymentUserMap = {};
  paymentUsers.forEach(pu => {
    if (userMap[pu.userId]) {
      paymentUserMap[pu.paymentId] = userMap[pu.userId];
    }
  });

  // Armar respuesta final
  const resultsWithExtras = results.map(transaction => {
    const t = transaction.toJSON();

    if (t.Payments && Array.isArray(t.Payments)) {
      t.Payments = t.Payments.map(payment => {
        const historial = historialMap[payment.id];
        const creador = paymentUserMap[payment.id];

        return {
          ...payment,
          saldoAnterior: historial ? historial.saldoAnterior : null,
          nuevoSaldo: historial ? historial.nuevoSaldo : null,
          creadoPor: creador || null,
        };
      });
    }

    return t;
  });

  return res.json(resultsWithExtras);
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

// GET /transaction/customer/:customerId
const getTransactionsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const transactions = await Transaction.findAll({
      where: { customerId: customerId, status: "inProgress" }, // solo activas
      order: [["createdAt", "ASC"]], // opcional, de más antiguo a más reciente
    });

    res.status(200).json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener transacciones del cliente" });
  }
};



const getOne = catchError(async (req, res) => {
  const { id } = req.params;

  const result = await Transaction.findByPk(id, {
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

  if (!result) return res.sendStatus(404);

  // Convertimos el resultado a objeto plano
  const transaction = result.toJSON();

  // Obtenemos todos los historiales de los pagos relacionados
  if (transaction.payments && transaction.payments.length > 0) {
    const paymentIds = transaction.payments.map(p => p.id);

    // Traemos solo los historiales de esos pagos
    const historiales = await HistorialSaldo.findAll({
      where: { pagoId: paymentIds },
    });

    // Creamos un mapa para fácil acceso
    const historialMap = {};
    historiales.forEach(h => {
      historialMap[h.pagoId] = h;
    });


    // Agregamos los saldos a cada pago
    transaction.payments = transaction.payments.map(payment => {
      const historial = historialMap[payment.id];
      return {
        ...payment,
        saldoAnterior: historial ? historial.saldoAnterior : null,
        nuevoSaldo: historial ? historial.nuevoSaldo : null,
      };
    });
  }

  return res.json(transaction);
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

  // 🧠 2. Extraer y normalizar todas las cédulas
  const cedulas = data.map((d) => String(d.cedula).trim());

  // 🚀 3. Buscar los clientes existentes en una sola consulta
  const customers = await Customer.findAll({
    where: { numberID: cedulas },
  });

  // 🔁 4. Crear mapa { cedula => customerId }
  const customerMap = {};
  customers.forEach((c) => {
    customerMap[String(c.numberID).trim()] = c.id;
  });

  // 🧱 5. Procesar contratos válidos
  const transformedContracts = [];
  const cedulasOmitidas = [];

  for (const contract of data) {
    const cedula = String(contract.cedula).trim();
    const customerId = customerMap[cedula];

    if (!customerId) {
      cedulasOmitidas.push(cedula);
      console.log(`Cédula no registrada: ${cedula}`);
      continue; // Ignora este contrato
    }

    const {
      contractNumber,
      interestsPorcent,
      amonunt, // Revisa si este nombre es correcto en tu modelo
      morosidadAmount,
      cuotesAmount,
      balance,
      capital,
      transactionType,
      interestsType,
    } = contract;

    const startDate = "2025-05-31";
    const nextPaymentDate = "2025-06-15";

    transformedContracts.push({
      customerId,
      contractNumber,
      interestsPorcent,
      amonunt,
      morosidadAmount,
      cuotesAmount,
      balance,
      capital,
      transactionType,
      interestsType,
      startDate,
      nextPaymentDate,
    });
  }

  // 💾 6. Guardar contratos si hay válidos
  let created = [];
  if (transformedContracts.length > 0) {
    created = await Transaction.bulkCreate(transformedContracts, {
      validate: true,
    });
  }

  // 📤 7. Responder con resumen
  return res.status(201).json({
    message: `Se crearon ${created.length} contratos. ${cedulasOmitidas.length > 0 ? `Se omitieron ${cedulasOmitidas.length} contratos por cédulas no registradas.` : ''}`,
    omitidas: cedulasOmitidas,
    contratos: created,
  });

});

const setPaidTransactions = catchError(async (req, res) => {
  const [updatedCount] = await Transaction.update(
    { status: 'paid' }, // valores a actualizar
    { 
      where: { 
        morosidadAmount: 0,
        capital: 0,
        status: 'inProgress'
      } 
    }
  );

  return res.json({
    message: `Se actualizaron ${updatedCount} transacciones a status = 'paid'`,
  });
});


// GET /transactions/filter
const getTransactionsByDate = catchError(async (req, res) => {
  const { startDate, endDate } = req.query;

  // Si no hay fechas, devolvemos todas
  const whereClause = {};
  if (startDate && endDate) {
    // rango de fechas
    whereClause.createdAt = { 
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  } else if (startDate) {
    // fecha única
    const date = new Date(startDate);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    whereClause.createdAt = { 
      [Op.gte]: date, 
      [Op.lt]: nextDay 
    };
  }

  const transactions = await Transaction.findAll({
    where: whereClause,
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
    order: [["createdAt", "ASC"]],
  });

  return res.json(transactions);
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
  createManyContracts,
  getTransactionsByCustomer,
  setPaidTransactions,
  getTransactionsByDate
};
