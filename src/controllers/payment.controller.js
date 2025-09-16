const catchError = require('../utils/catchError');
const Payment = require('../models/Payment.js');
const Transaction = require('../models/Transaction.js')
const Customer = require('../models/Customer.js');
const PaymentUsers = require('../models/PaymentsUsers.js');

// Define associations

const { Op } = require("sequelize");

const removeByMonth = catchError(async (req, res) => {
  const { month } = req.params; // ejemplo: /payments/removeByMonth/6
  const { year } = req.query;   // opcional: /payments/removeByMonth/6?year=2025

  const targetYear = year || new Date().getFullYear();

  // rango de fechas en base al campo paymentDate
  const startDate = new Date(targetYear, month - 1, 1); // primer día del mes
  const endDate = new Date(targetYear, month, 1);       // primer día del mes siguiente

  const deletedCount = await Payment.destroy({
    where: {
      paymentDate: {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      },
    },
  });

  return res.json({
    message: `Pagos eliminados en ${month}/${targetYear}: ${deletedCount}`,
  });
});


const getAll = catchError(async (req, res) => {
  const results = await Payment.findAll({
    include: [
      {
        model: Transaction,
        include: [
          {
            model: Customer,
          },
        ],
      },
    ],
  });
  return res.json(results);
});


const getpaymentCount = catchError(async(req, res) => {
    const results = await Payment.findAll();
    let paymentCount = results.length;
    paymentCount = paymentCount + 1
    const formattedPaymentCount = paymentCount.toString().padStart(7, '0')
    console.log(formattedPaymentCount)
    return res.json(formattedPaymentCount);
});


const create = async (req, res) => {
  const { userId, ...paymentData } = req.body;

  try {
    // Crear pago
    const newPayment = await Payment.create(paymentData);

    // Registrar usuario que hizo el pago
    if (userId) {
      await PaymentUsers.create({
        userId,
        paymentId: newPayment.id,
      });
    }

    res.status(201).json(newPayment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear el pago" });
  }
};


const getOne = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await Payment.findByPk(id);
    if(!result) return res.sendStatus(404);
    return res.json(result);
});

const remove = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await Payment.destroy({ where: {id} });
    if(!result) return res.sendStatus(404);
    return res.sendStatus(204);
});

const update = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await Payment.update(
        req.body,
        { where: {id}, returning: true }
    );
    if(result[0] === 0) return res.sendStatus(404);
    return res.json(result[1][0]);
});

const setAllRegistered = catchError(async (req, res) => {
  const [updatedCount] = await Payment.update(
    { isRegistered: true }, // valores a actualizar
    { where: {} }           // sin condición = todos los registros
  );

  return res.json({
    message: `Se actualizaron ${updatedCount} pagos a isRegistered = true`,
  });
});
const setRegisteredByIds = catchError(async (req, res) => {
  const { ids } = req.body; // ids debe ser un array, ej: [1, 2, 3]

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Debes enviar un array de IDs válido' });
  }

  const [updatedCount] = await Payment.update(
    { isRegistered: true },
    { where: { id: ids } }
  );

  return res.json({
    message: `Se actualizaron ${updatedCount} pagos a isRegistered = true`,
  });
});





const getPaymentsByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    // 1️⃣ Buscar todos los registros de PaymentUsers para ese usuario
    const paymentUserRecords = await PaymentUsers.findAll({
      where: { userId },
      attributes: ['paymentId']
    });

    const paymentIds = paymentUserRecords.map(pu => pu.paymentId);

    if (paymentIds.length === 0) {
      return res.json([]); // si no tiene pagos, devolvemos array vacío
    }

    // 2️⃣ Buscar los payments por los ids y agregar include de Transaction + Customer
    const payments = await Payment.findAll({
      where: { id: paymentIds },
      include: [
        {
          model: Transaction,
          include: [
            {
              model: Customer
            }
          ]
        }
      ],
      order: [['paymentDate', 'DESC']]
    });

    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los pagos del usuario' });
  }
};



module.exports = {
    getAll,
    getpaymentCount,
    create,
    getOne,
    remove,
    update,
    removeByMonth,
    setAllRegistered,
    setRegisteredByIds,
    getPaymentsByUser
    
}