
const { Op } = require('sequelize');
const {
  Transaction,
  Cuotes,
  Customer,
  User,
} = require('../models');
const Refinanciamientos = require('../models/Refinanciamientos');
const DisbursementAccount = require('../models/DisbursementAccount');

const sequelize = require('../utils/connection');

// 🔥 generar cuotas desde tabla amortizada
/** Formato YYYY-MM-DD sin desfase de zona horaria */
const toDateOnly = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/**
 * Parsea YYYY-MM-DD o Date a Date local (mediodía para evitar saltos de día).
 */
const parseLocalDate = (value) => {
  if (!value) return new Date();
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0);
  }
  const s = String(value).slice(0, 10);
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
};

/**
 * Siguiente fecha de cuota quincenal:
 * - si el día < 15  → día 15 del mismo mes
 * - si el día === 15 → último día del mismo mes
 * - si el día > 15  → día 15 del mes siguiente
 */
const siguienteFechaCuota = (fechaAnterior) => {
  const d = parseLocalDate(fechaAnterior);
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();

  if (day < 15) {
    return new Date(year, month, 15, 12, 0, 0);
  }
  if (day === 15) {
    // último día del mes actual
    return new Date(year, month + 1, 0, 12, 0, 0);
  }
  // fin de mes → 15 del mes siguiente
  return new Date(year, month + 1, 15, 12, 0, 0);
};

const generarCuotas = async ({ transaction, amortizationTable, t }) => {
  const cuotas = [];

  // 1ª cuota: nextPaymentDate de la transacción
  let fechaCuota = parseLocalDate(transaction.nextPaymentDate);

  for (const row of amortizationTable) {
    cuotas.push({
      cuoteNumber: row.numeroCuota.toString(),
      amount: row.cuota,
      capitalAmount: row.capital,
      amountInterest: row.interes,
      paymentCutDate: toDateOnly(fechaCuota),
      transactionId: transaction.id,
      status: "notPaid",
    });

    // siguientes: 15 o fin de mes respecto a la anterior
    fechaCuota = siguienteFechaCuota(fechaCuota);
  }

  await Cuotes.bulkCreate(cuotas, { transaction: t });
};

// 🔥 crear préstamo amortizado
const createAmortizedLoan = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      capital,
      balance,
      interestsType,
      interestsPorcent,
      cuotes,
      cuotesAmount,
      interestAmount,
      startDate,
      nextPaymentDate,
      description,
      transactionType,
      customerId,
      userId,
      amortizationTable,
      cuentaDesembolso, // 👈 NUEVO
    } = req.body;

    // 🔥 validaciones básicas
    if (!capital || !customerId || !userId) {
      return res.status(400).json({
        message: 'Faltan datos obligatorios',
      });
    }

    const customer = await Customer.findByPk(customerId);

    if (!customer) {
      return res.status(404).json({
        message: 'Cliente no encontrado',
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
      });
    }

    // 🔥 crear transacción
    const transaction = await Transaction.create(
      {
        capital,

        amonunt: capital,

        balance,


        interestsType,

        interestsPorcent,

        cuotes,

        cuotesAmount,

        interestAmount,

        startDate,

        nextPaymentDate,

        description,

        transactionType,

        customerId,

        userId,


        status: 'inProgress',
      },
      {
        transaction: t,
      }
    );
    // 🔥 guardar cuenta de desembolso
if (cuentaDesembolso) {
  await DisbursementAccount.create(
    {
      transactionId: transaction.id,
      bankName: cuentaDesembolso,
    },
    {
      transaction: t,
    }
  );
}

    const year = new Date().getFullYear();
const paddedId = String(transaction.id).padStart(6, "0");
const contractNumber = `${year}-${paddedId}`;

await transaction.update(
  { contractNumber },
  { transaction: t }
);

    // 🔥 generar cuotas
    if (
      amortizationTable &&
      Array.isArray(amortizationTable) &&
      amortizationTable.length > 0
    ) {
      await generarCuotas({
        transaction,
        amortizationTable,
        t,
      });
    }

    await t.commit();

    const result = await Transaction.findByPk(transaction.id, {
      include: [
        {
          model: Cuotes,
          as: 'transactionCuotes',
        },
        {
      model: DisbursementAccount,
    },
      ],
    });

    return res.status(201).json(result);
  } catch (error) {
    await t.rollback();

    console.error(error);

    return res.status(500).json({
      message: 'Error al crear préstamo amortizado',
      error: error.message,
    });
  }
};


const createAmortizedRefinancing = async (
  req,
  res
) => {
  const t =
    await sequelize.transaction();

  try {
    const {
      capital,
      balance,
      interestsType,
      interestsPorcent,
      cuotes,
      cuotesAmount,
      interestAmount,
      startDate,
      nextPaymentDate,
      description,
      transactionType,
      customerId,
      userId,
      amortizationTable,
      contratosRefinanciados,
      cuentaDesembolso,
    } = req.body;
    console.log("Datos recibidos:", req.body);

    // 🔥 validaciones básicas
    if (
      !capital ||
      !customerId ||
      !userId
    ) {
      return res.status(400).json({
        message:
          "Faltan datos obligatorios",
      });
    }

    const customer =
      await Customer.findByPk(
        customerId
      );

    if (!customer) {
      return res.status(404).json({
        message:
          "Cliente no encontrado",
      });
    }

    const user =
      await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        message:
          "Usuario no encontrado",
      });
    }

    // 🔥 crear nuevo contrato amortizado
    const transaction =
      await Transaction.create(
        {
          capital,

          amonunt: capital,

          balance,

          interestsType,

          interestsPorcent,

          cuotes,

          cuotesAmount,

          interestAmount,

          startDate,

          nextPaymentDate,

          description,

          transactionType,

          customerId,

          userId,


          status: "inProgress",
        },
        {
          transaction: t,
        }
      );
      // 🔥 guardar cuenta de desembolso
if (cuentaDesembolso) {
  await DisbursementAccount.create(
    {
      transactionId: transaction.id,
      bankName: cuentaDesembolso,
    },
    {
      transaction: t,
    }
  );
}

    // 🔥 generar número de contrato
    const year =
      new Date().getFullYear();

    const paddedId = String(
      transaction.id
    ).padStart(6, "0");

    const contractNumber = `${year}-${paddedId}`;

    await transaction.update(
      {
        contractNumber,
      },
      {
        transaction: t,
      }
    );

    // 🔥 generar cuotas
    if (
      amortizationTable &&
      Array.isArray(
        amortizationTable
      ) &&
      amortizationTable.length > 0
    ) {
      await generarCuotas({
        transaction,
        amortizationTable,
        t,
      });
    }

    // 🔥 marcar contratos refinanciados
    if (
      Array.isArray(
        contratosRefinanciados
      ) &&
      contratosRefinanciados.length > 0
    ) {
      const ids = contratosRefinanciados.map(c => c.id);

await Transaction.update(
  {
    status: "refinanciado",
    transactionType: "prestamo refinanciado",
  },
  {
    where: {
      id: {
        [Op.in]: ids,
      },
    },
    transaction: t,
  }
);

      // 🔥 registrar refinanciamiento
      await Refinanciamientos.create(
        {
          numeroContrato:
            transaction.id,

          contratosRefinanciados:ids,
        },
        {
          transaction: t,
        }
      );
    }

    await t.commit();

    const result =
      await Transaction.findByPk(
        transaction.id,
        {
          include: [
            {
              model: Cuotes,
              as: "transactionCuotes",
            },    
            {
          model: DisbursementAccount,
        },     
          ],
        }
      );

    return res.status(201).json({
      contratoNuevo: result,
      refinanciamiento: {
        numeroContrato:
          transaction.id,
        contratosRefinanciados,
      },
      cliente: customer,
    });
  } catch (error) {
    await t.rollback();

    console.error(error);

    return res.status(500).json({
      message:
        "Error al crear refinanciamiento amortizado",
      error: error.message,
    });
  }
};


// 🔥 obtener todos los préstamos amortizados
const getAllAmortizedLoans = async (req, res) => {
  try {
    const loans = await Transaction.findAll({
      where: {
        interestsType: 'normal',
      },

      include: [
        {
          model: Customer,
        },
        {
          model: User,
        },
        {
          model: Cuotes,
          as: 'transactionCuotes',
        },
      ],

      order: [['createdAt', 'DESC']],
    });

    return res.json(loans);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error obteniendo préstamos',
    });
  }
};

// 🔥 obtener préstamo por id
const getAmortizedLoanById = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await Transaction.findByPk(id, {
      include: [
        {
          model: Customer,
        },
        {
          model: User,
        },
        {
          model: Cuotes,
          as: 'transactionCuotes',
        },
      ],
    });

    if (!loan) {
      return res.status(404).json({
        message: 'Préstamo no encontrado',
      });
    }

    return res.json(loan);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error obteniendo préstamo',
    });
  }
};

module.exports = {
  createAmortizedLoan,
  getAllAmortizedLoans,
  getAmortizedLoanById,
  createAmortizedRefinancing,
};


