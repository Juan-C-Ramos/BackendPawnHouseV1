// routes/ventasCredito.routes.js

const express = require('express');
const router = express.Router();

const {
  create,
  getAll,
  getById,
  getByTransactionId,
  update,
  remove,
  search,
  reportes,
  reportesPagos
} = require('../controllers/ventasCredito.controller.js'); // ajusta la ruta si es necesario

// Crear (Transaction + VentasCredito + Cuotas + DisbursementAccount)
router.post('/', create);

// Obtener todas las ventas a crédito
router.get('/', getAll);

router.get("/search", search); // Endpoint para buscar ventas a crédito por nombre del cliente

router.get("/reportes/pagos", reportesPagos);

router.get("/reportes", reportes);


// Obtener venta a crédito por transactionId
router.get('/transaction/:transactionId', getByTransactionId);

// Obtener una venta a crédito por su ID
router.get('/:id', getById);



// Actualizar venta a crédito
router.put('/:id', update);

// Eliminar venta a crédito
router.delete('/:id', remove);

module.exports = router;