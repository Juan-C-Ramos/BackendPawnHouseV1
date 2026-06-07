const express = require('express');

const router = express.Router();

const {
  createAmortizedLoan,
  getAllAmortizedLoans,
  getAmortizedLoanById,
} = require('../controllers/amortizedLoan.controller');

// 🔥 crear préstamo
router.post('/', createAmortizedLoan);

// 🔥 obtener todos
router.get('/', getAllAmortizedLoans);

// 🔥 obtener uno
router.get('/:id', getAmortizedLoanById);

module.exports = router;