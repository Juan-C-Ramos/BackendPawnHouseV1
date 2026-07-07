// controllers/pdf/reciboPagoPrestamo.controller.js

const PDFDocument = require("pdfkit");
const path = require("path");

const {
  Payment,
  Transaction,
  Customer,
  User,
  Cuotes
} = require("../models");

const HistorialSaldo = require("../models/HistorialSaldo");
const PaymentUsers = require("../models/PaymentsUsers");

const generarReciboPagoPrestamoPDF = async (req, res) => {

  try {
    const { pagoId } = req.params;
    console.log("Generando recibo para pago ID:", pagoId);

    const pago = await Payment.findByPk(pagoId, {
      include: [
        {
          model: Transaction,
          include: [
            Customer,
            {
              model: Cuotes,
              as: "transactionCuotes",
              
              required: false,
            },
          ],
        },
      ],
    });

    if (!pago) {
      return res.status(404).json({
        message: "Pago no encontrado",
      });
    }
    console.log("Pago encontrado:", pago.toJSON());

    const historial = await HistorialSaldo.findOne({
      where: {
        pagoId: pago.id,
      },
    });
    console.log("Historial de saldo encontrado:", historial ? historial.toJSON() : "No encontrado");

    const paymentUser = await PaymentUsers.findOne({
      where: {
        paymentId: pago.id,
      },
    });

    let usuario = null;

    if (paymentUser) {
      usuario = await User.findByPk(paymentUser.userId);
    }

    const transaccion = pago.transaction;
    const cliente = transaccion.customer;

    const cuotasPendientes =
  transaccion.transactionCuotes || [];

const saldoCapital = cuotasPendientes.reduce(
  (total, cuota) =>
    total + Number(cuota.capitalAmount || 0),
  0
);

const saldoInteres = cuotasPendientes.reduce(
  (total, cuota) =>
    total + Number(cuota.amountInterest || 0),
  0
);

const saldoCapitalAnterior =
  saldoCapital + Number(pago.capital || 0);

const saldoInteresAnterior =
  saldoInteres + Number(pago.interestAmount || 0);

const saldoTotalAnterior =
  saldoCapitalAnterior +
  saldoInteresAnterior +
  Number(transaccion.morosidadAmount || 0) +
  Number(pago.layPaymentFee || 0);

const saldoTotal =
  saldoCapital +
  saldoInteres +
  Number(transaccion?.morosidadAmount || 0);

    // const logoPath = path.join(
    //   __dirname,
    //   "../../logoVFinal.png"
    // );

    const doc = new PDFDocument({
      size: [198, 700],
      margin: 10,
    });

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename="recibo_pago_${pago.id}.pdf"`
    );

    doc.pipe(res);

    // ====================================
    // ENCABEZADO
    // ====================================





    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("LIR Tecnología a la Vanguardia", {
        align: "center",
      });

    doc
      .fontSize(8)
      .font("Helvetica")
      .text(
        " ",
        {
          align: "center",
        }
      );



    doc
      .fontSize(8)
      .text(
        "RUC 1556557158-2-2017 DV 56",
        {
          align: "center",
        }
      );

    doc.moveDown(1.5);

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("RECIBO DE COBRO", {
        align: "center",
      });

    doc.moveDown(0.8);

    // ====================================
    // DATOS GENERALES
    // ====================================

    doc.fontSize(10).font("Helvetica");

    doc.text(`RECIBO N°: ${pago.id}`);

    doc.text(
      `CONTRATO: ${transaccion.contractNumber}`
    );

    doc.text(
      `FECHA: ${pago.paymentDate}`
    );

    doc.moveDown(0.5);

    doc.text(
      `CLIENTE: ${cliente.firstName} ${cliente.lastName}`
    );

    doc.text(
      `METODO: ${pago.paymentMethod}`
    );

    doc.moveDown(0.5);

    doc.text(
      "-----------------------------------------------------",
      {
        align: "center",
      }
    );

    doc.moveDown(0.3);

    doc.text(
      "CONCEPTO: Pago de préstamo"
    );

    doc.moveDown(0.4);

    // ====================================
    // SALDOS ANTERIORES
    // ====================================

    doc.font("Helvetica-Bold")
   .text("SALDO ANTERIOR");

doc.font("Helvetica");

if (transaccion.interestsType === "amortizado") {

  doc.text(
    "Capital",
    10,
    doc.y,
    { continued: true }
  );

  doc.text(
    `B/. ${saldoCapitalAnterior.toFixed(2)}`,
    {
      align: "right",
    }
  );

  doc.text(
    "Interés",
    10,
    doc.y,
    { continued: true }
  );

  doc.text(
    `B/. ${saldoInteresAnterior.toFixed(2)}`,
    {
      align: "right",
    }
  );

  doc.text(
    "Morosidad",
    10,
    doc.y,
    { continued: true }
  );

  doc.text(
    `B/. ${(Number(transaccion.morosidadAmount || 0) + Number(pago.layPaymentFee || 0)).toFixed(2)}`,
    {
      align: "right",
    }
  );

  doc.moveDown(0.3);

  doc.font("Helvetica-Bold");

  doc.text(
    "Total Adeudado",
    10,
    doc.y,
    { continued: true }
  );

  doc.text(
    `B/. ${saldoTotalAnterior.toFixed(2)}`,
    {
      align: "right",
    }
  );

  doc.font("Helvetica");

} else {

  doc.text(
    "Capital",
    10,
    doc.y,
    { continued: true }
  );

  doc.text(
    `B/. ${Number(historial?.saldoAnterior || 0).toFixed(2)}`,
    {
      align: "right",
    }
  );

}

    // ====================================
    // DETALLE DEL PAGO
    // ====================================

    doc
      .font("Helvetica-Bold")
      .text("DETALLE DEL PAGO");

    doc.font("Helvetica");

    doc.text(
      "Abono Capital",
      10,
      doc.y,
      { continued: true }
    );

    doc.text(
      `B/. ${Number(
        pago.capital || 0
      ).toFixed(2)}`,
      {
        align: "right",
      }
    );

    doc.text(
      "Interés",
      10,
      doc.y,
      { continued: true }
    );

    doc.text(
      `B/. ${Number(
        pago.interestAmount || 0
      ).toFixed(2)}`,
      {
        align: "right",
      }
    );

    doc.text(
      "Morosidad",
      10,
      doc.y,
      { continued: true }
    );

    doc.text(
      `B/. ${Number(
        pago.layPaymentFee || 0
      ).toFixed(2)}`,
      {
        align: "right",
      }
    );

    doc.text(
      "ITBMS (7%)",
      10,
      doc.y,
      { continued: true }
    );

    doc.text(
      `B/. ${Number(
        pago.itbms || 0
      ).toFixed(2)}`,
      {
        align: "right",
      }
    );

    doc.moveDown(0.5);

    doc.text(
      "-----------------------------------------------------",
      {
        align: "center",
      }
    );

    doc.moveDown(0.4);

    // ====================================
    // TOTAL
    // ====================================

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(
        "TOTAL PAGADO",
        10,
        doc.y,
        {
          continued: true,
        }
      );

    doc.text(
      `B/. ${Number(
        pago.amount || 0
      ).toFixed(2)}`,
      {
        align: "right",
      }
    );

    doc.moveDown(0.6);

    doc
      .fontSize(9)
      .font("Helvetica");

    doc.text(
      "-----------------------------------------------------",
      {
        align: "center",
      }
    );

    doc.moveDown(0.4);

    // ====================================
// SALDO ACTUAL
// ====================================

doc
  .font("Helvetica-Bold")
  .text("SALDO ACTUAL");

doc.font("Helvetica");

if (transaccion.interestsType === "amortizado") {

  // Capital pendiente
  doc.text(
    "Capital",
    10,
    doc.y,
    { continued: true }
  );

  doc.text(
    `B/. ${saldoCapital.toFixed(2)}`,
    {
      align: "right",
    }
  );

  // Interés pendiente
  doc.text(
    "Interés",
    10,
    doc.y,
    { continued: true }
  );

  doc.text(
    `B/. ${saldoInteres.toFixed(2)}`,
    {
      align: "right",
    }
  );

  // Morosidad
  doc.text(
    "Morosidad",
    10,
    doc.y,
    { continued: true }
  );

  doc.text(
    `B/. ${Number(
      transaccion?.morosidadAmount || 0
    ).toFixed(2)}`,
    {
      align: "right",
    }
  );

  doc.moveDown(0.3);

  doc
    .font("Helvetica-Bold")
    .text(
      "Total Adeudado",
      10,
      doc.y,
      { continued: true }
    );

  doc.text(
    `B/. ${saldoTotal.toFixed(2)}`,
    {
      align: "right",
    }
  );

  doc.font("Helvetica");

} else if (
  transaccion.interestsType === "abonoCapital"
) {

  doc.text(
    "Capital",
    10,
    doc.y,
    { continued: true }
  );

  doc.text(
    `B/. ${Number(
      historial?.nuevoSaldo || 0
    ).toFixed(2)}`,
    {
      align: "right",
    }
  );

  doc.text(
    "Morosidad",
    10,
    doc.y,
    { continued: true }
  );

  doc.text(
    `B/. ${Number(
      transaccion?.morosidadAmount || 0
    ).toFixed(2)}`,
    {
      align: "right",
    }
  );

}

doc.moveDown(4);

    // ====================================
    // FIRMA
    // ====================================

    const firmaY = doc.y;

    doc
      .moveTo(15, firmaY)
      .lineTo(180, firmaY)
      .stroke();

    doc.moveDown(0.3);

    doc
      .fontSize(8)
      .font("Helvetica");

    doc.text(
      "RECIBIDO POR",
      {
        align: "center",
      }
    );

    doc.text(
      usuario
        ? `${usuario.firstName} ${usuario.lastName}`
        : "Sistema",
      {
        align: "center",
      }
    );

    doc.end();

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Error generando recibo PDF",
      error: error.message,
    });
  }
};

module.exports = {
  generarReciboPagoPrestamoPDF,
};