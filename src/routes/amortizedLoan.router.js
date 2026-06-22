const express = require('express');

const router = express.Router();

const {
  createAmortizedLoan,
  getAllAmortizedLoans,
  getAmortizedLoanById,
  createAmortizedRefinancing,
} = require('../controllers/amortizedLoan.controller');




// 🔥 crear préstamo
router.post('/', createAmortizedLoan);

// 🔥 obtener todos
router.get('/', getAllAmortizedLoans);

// 🔥 obtener uno
router.get('/:id', getAmortizedLoanById);

// 🔥 crear refinanciamiento amortizado
router.post('/refinancing', createAmortizedRefinancing);

module.exports = router;