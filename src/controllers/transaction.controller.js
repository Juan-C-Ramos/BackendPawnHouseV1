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

const Refinanciamientos = require("../models/Refinanciamientos");


const HistorialSaldo = require("../models/HistorialSaldo");
const { Op } = require("sequelize");
const PaymentUsers = require("../models/PaymentsUsers.js");


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
  console.log("Datos recibidos:", req.body);

  const {
    capital,
    balance,
    interestsType,
    interestsPorcent,
    startDate,
    nextPaymentDate,
    description,
    transactionType,
    customerId,
    userId,
    cuentaDesembolso, // 👈 NUEVO
  } = req.body;

  // 🔥 Validaciones básicas
  if (!capital || !interestsType || !startDate || !transactionType) {
    return res.status(400).json({
      message: "Faltan campos obligatorios",
    });
  }

  // 🔹 Adaptar datos al modelo
  const transactionData = {
    amonunt: capital,
    capital,
    balance: balance || capital,
    interestsType,
    interestsPorcent,
    startDate,
    nextPaymentDate,
    description: description || "",
    transactionType,
    customerId,
    userId,
    interestAmount: 0,
    morosidadAmount: 0,
  };

  // 1️⃣ Crear transacción
  const result = await Transaction.create(transactionData);

  // 2️⃣ Guardar cuenta de desembolso
  if (cuentaDesembolso) {
    await DisbursementAccount.create({
      transactionId: result.id,
      bankName: cuentaDesembolso,
    });
  }

  // 3️⃣ Generar número de contrato
  const year = new Date().getFullYear();
  const paddedId = String(result.id).padStart(6, "0");
  const contractNumber = `${year}-${paddedId}`;

  await result.update({ contractNumber });

  // 4️⃣ Buscar completo
  const resultComplete = await Transaction.findByPk(result.id, {
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
      {
        model: DisbursementAccount, // 👈 NUEVO
      },
    ],
  });

  res.status(201).json(resultComplete);
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
    order: [[{ model: Cuote, as: "transactionCuotes" }, "cuoteNumber", "ASC"]],
  });

  if (!result) return res.sendStatus(404);

  const transaction = result.toJSON();

  if (transaction.payments && transaction.payments.length > 0) {
    const paymentIds = transaction.payments.map((p) => p.id);

    // 1️⃣ Historiales de saldo
    const historiales = await HistorialSaldo.findAll({
      where: { pagoId: paymentIds },
    });

    // 2️⃣ PaymentUsers
    const paymentUsers = await PaymentUsers.findAll({
      where: { paymentId: paymentIds },
    });
    const paymentUsersArray = Array.isArray(paymentUsers) ? paymentUsers : [];

    // 3️⃣ Usuarios creadores
    const userIds = paymentUsersArray.map((pu) => pu.userId);
    const users = await User.findAll({
      where: { id: userIds },
      attributes: { exclude: ["password"] },
      include: [Role],
    });

    // 4️⃣ Mapas
    const historialMap = {};
    historiales.forEach((h) => (historialMap[h.pagoId] = h));

    const paymentUserMap = {};
    paymentUsersArray.forEach((pu) => (paymentUserMap[pu.paymentId] = pu.userId));

    const userMap = {};
    users.forEach((u) => (userMap[u.id] = u.toJSON()));

    // 5️⃣ Agregar info combinada
    transaction.payments = transaction.payments.map((payment) => {
      const historial = historialMap[payment.id];
      const userId = paymentUserMap[payment.id];
      const creadoPor = userId ? userMap[userId] || null : null;

      return {
        ...payment,
        saldoAnterior: historial ? historial.saldoAnterior : null,
        nuevoSaldo: historial ? historial.nuevoSaldo : null,
        creadoPor,
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
  console.log("aqui")
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
  console.log("Query params recibidos:", req.query); // Verificar qué query params llegan
  const { startDate, endDate } = req.query;

  const whereClause = {};

  if (startDate && endDate) {
    whereClause.startDate = {
      [Op.between]: [startDate, endDate],
    };
  } else if (startDate) {
    whereClause.startDate = startDate;
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
    order: [["startDate", "ASC"]],
  });

  // 🔥 Aquí agregamos la lógica del refinanciamiento
  const transactionsWithRefinancedAmount = await Promise.all(
    transactions.map(async (transaction) => {
      let refinancedAmount = 0;

      // Solo si es refinanciamiento
      if (
        transaction.transactionType === "refinanciamiento" ||
        transaction.transactionType === "prestamo refinanciado"
      ) {
        const refin = await Refinanciamientos.findOne({
          where: { numeroContrato: transaction.id },
        });

        if (refin && refin.contratosRefinanciados?.length > 0) {
          const oldTransactions = await Transaction.findAll({
            where: {
              id: {
                [Op.in]: refin.contratosRefinanciados,
              },
            },
          });
          console.log(`Transacciones antiguas para contratos ${refin.contratosRefinanciados}:`, oldTransactions);

          const totalCapitalMorosidad = oldTransactions.reduce(
            (acc, t) =>
              acc +
              (Number(t.capital) || 0) +
              (Number(t.morosidadAmount) || 0),
            0
          );

          refinancedAmount =
            (Number(transaction.amonunt) || 0) - totalCapitalMorosidad;
        }
      }

      return {
        ...transaction.toJSON(),
        refinancedAmount,
      };
    })
  );

  return res.json(transactionsWithRefinancedAmount);
});


const getDeudasTransactions = async (req, res) => {
  try {
    const deudas = await Transaction.findAll({
      where: {
        status: "inProgress",   // 🔥 Solo transacciones pendientes / con deuda
      },
      order: [["id", "ASC"]],
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

    return res.status(200).json(deudas);
  } catch (error) {
    console.error("Error al obtener transacciones de deudas:", error);
    return res.status(500).json({ message: "Error al obtener deudas" });
  }
};

const PDFDocument = require("pdfkit");

const getPagare = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔹 Buscar la transacción con relaciones
    const transaction = await Transaction.findByPk(id, {
      include: [Customer, User],
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transacción no encontrada" });
    }

    const customer = transaction.customer;

    // 🔹 Configurar headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=pagare-${transaction.contractNumber}.pdf`
    );

    // 🔹 Crear documento
    const doc = new PDFDocument({ margin: 50 });

    // 🔹 Pipe al response
    doc.pipe(res);

    // =========================
    // 📄 HEADER
    // =========================
    doc.fontSize(16).text(`PAGARÉ ${transaction.contractNumber}`, {
      align: "center",
    });

    doc.moveDown();

    const fecha = new Date(transaction.startDate);
    doc
      .fontSize(10)
      .text(
        `Panamá, ${fecha.getDate()} de ${
          fecha.getMonth() + 1
        } de ${fecha.getFullYear()}`,
        { align: "right" }
      );

    doc.moveDown(2);

    // =========================
    // 🏢 PRESTAMISTA
    // =========================
    doc.fontSize(11).text("PRESTAMISTA:", { underline: true });

    doc.text(
      "LIR TECNOLOGÍA A LA VANGUARDIA, S.A. | RUC: 155657158-2-2017 DV 56"
    );
    doc.text(
      "Dirección: Ciudad de Panamá, Bella Vista, Vía España, Plaza Concordia oficina 247"
    );
    doc.text("Teléfono: 211-3178");
    doc.text("Representante: ISRAEL RODRIGUEZ WARREN");

    doc.moveDown();

    // =========================
    // 👤 PRESTATARIO
    // =========================
    doc.fontSize(11).text("PRESTATARIO:", { underline: true });

    doc.text(
      `Nombre: ${customer.firstName} ${customer.lastName}`
    );
    doc.text(`Cédula: ${customer.numberID}`);
    doc.text(`Teléfono: ${customer.phone || "N/A"}`);

    doc.moveDown();

    // =========================
    // 💰 DATOS DEL PRÉSTAMO
    // =========================
    doc.text(`Monto: B/. ${transaction.capital}`);
    doc.text(`Interés: ${transaction.interestsPorcent}%`);
    doc.text(`Cuota mínima: B/. ${transaction.cuotesAmount}`);
    doc.text(`Balance total: B/. ${transaction.balance}`);

    doc.moveDown();

    // =========================
    // 📜 CLÁUSULAS (simplificadas)
    // =========================
    doc.fontSize(10);

    doc.text(
      "El prestatario se compromete a pagar el monto recibido junto con los intereses acordados."
    );

    doc.moveDown();

    doc.text(
      "Los pagos se aplicarán primero a intereses, luego a capital."
    );

    doc.moveDown();

    doc.text(
      "En caso de mora, se aplicarán recargos conforme a lo establecido."
    );

    doc.moveDown(2);

    // =========================
    // ✍️ FIRMAS
    // =========================
    doc.text("__________________________", 100, 650);
    doc.text("Prestamista", 120, 670);

    doc.text("__________________________", 350, 650);
    doc.text("Prestatario", 370, 670);

    // 🔹 Finalizar
    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generando pagaré" });
  }
};




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
  getTransactionsByDate,
  getDeudasTransactions,  
  getPagare,


};
