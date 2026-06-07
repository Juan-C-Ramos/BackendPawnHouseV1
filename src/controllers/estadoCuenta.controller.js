const Customer = require("../models/Customer");
const HistorialSaldo = require("../models/HistorialSaldo");
const Transaction = require("../models/Transaction");
const Payment = require("../models/Payment");
const catchError = require("../utils/catchError");

const getEstadoCuenta = catchError(async (req, res) => {
  const { customerId } = req.params;

  const customer = await Customer.findByPk(customerId);

  if (!customer) {
    return res.status(404).json({
      message: "Cliente no encontrado",
    });
  }

  const transactions = await Transaction.findAll({
    where: {
      customerId,
    },
    include: [
      {
        model: Payment,
        include: [
          {
            model: HistorialSaldo,
          },
        ],
      },
    ],
    order: [["createdAt", "ASC"]],
  });

  const movimientos = [];

  for (const transaction of transactions) {
    // Movimiento inicial del préstamo
    movimientos.push({
      fecha: transaction.startDate,
      tipo: "PRESTAMO",
      documento: transaction.contractNumber,
      transactionId: transaction.id,

      capitalPagado: 0,
      interesPagado: 0,
      moraPagada: 0,
      itbms: 0,

      montoMovimiento: transaction.amonunt,

      saldoAnterior: 0,
      saldoNuevo: transaction.amonunt,
    });

    const pagos = [...(transaction.payments || [])].sort(
      (a, b) =>
        new Date(a.paymentDate) -
        new Date(b.paymentDate)
    );

    for (const pago of pagos) {
      const historial = pago.historialSaldo;

      movimientos.push({
        fecha: pago.paymentDate,
        tipo: "PAGO",
        documento: pago.id,

        transactionId: transaction.id,

        capitalPagado: Number(
          pago.capital || 0
        ),

        interesPagado: Number(
          pago.interestAmount || 0
        ),

        moraPagada: Number(
          pago.layPaymentFee || 0
        ),

        itbms: Number(
          pago.itbms || 0
        ),

        montoMovimiento: Number(
          pago.amount || 0
        ),

        saldoAnterior: Number(
          historial?.saldoAnterior || 0
        ),

        saldoNuevo: Number(
          historial?.nuevoSaldo || 0
        ),
      });
    }
  }

  movimientos.sort(
    (a, b) =>
      new Date(a.fecha) -
      new Date(b.fecha)
  );

  const resumen = {
    totalPrestado: 0,
    totalPagado: 0,
    totalCapital: 0,
    totalIntereses: 0,
    totalMora: 0,
    totalItbms: 0,
    saldoActual: 0,
  };

  movimientos.forEach((mov) => {
    if (mov.tipo === "PRESTAMO") {
      resumen.totalPrestado +=
        mov.montoMovimiento;

      resumen.saldoActual =
        mov.saldoNuevo;
    }

    if (mov.tipo === "PAGO") {
      resumen.totalPagado +=
        mov.montoMovimiento;

      resumen.totalCapital +=
        mov.capitalPagado;

      resumen.totalIntereses +=
        mov.interesPagado;

      resumen.totalMora +=
        mov.moraPagada;

      resumen.totalItbms += mov.itbms;

      resumen.saldoActual =
        mov.saldoNuevo;
    }
  });

  return res.json({
    customer: {
      id: customer.id,
      nombre: `${customer.firstName} ${customer.lastName}`,
      telefono: customer.phone,
      email: customer.email,
    },

    resumen,

    movimientos,
  });
});

module.exports = {
  getEstadoCuenta,
};