const catchError = require('../utils/catchError');
const Payment = require('../models/Payment.js');
const Transaction = require('../models/Transaction.js')
const Customer = require('../models/Customer.js');
// Define associations

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

const create = catchError(async(req, res) => {
    const result = await Payment.create(req.body);
    return res.status(201).json(result);
});

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

module.exports = {
    getAll,
    getpaymentCount,
    create,
    getOne,
    remove,
    update
}