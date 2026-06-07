
const {
  Transaction,
  Cuotes,
  Customer,
  User,
} = require('../models');

const sequelize = require('../utils/connection');

// 🔥 generar cuotas desde tabla amortizada
const generarCuotas = async ({
  transaction,
  amortizationTable,
  t,
}) => {
  const cuotas = [];

  for (const row of amortizationTable) {
    cuotas.push({
      cuoteNumber: row.numeroCuota.toString(),

      amount: row.cuota,

      capitalAmount: row.capital,

      amountInterest: row.interes,

      paymentCutDate: transaction.nextPaymentDate,

      transactionId: transaction.id,

      status: 'notPaid',
    });
  }

  await Cuotes.bulkCreate(cuotas, {
    transaction: t,
  });
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
      branchId,
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

        branchId,

        status: 'inProgress',
      },
      {
        transaction: t,
      }
    );

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
};


