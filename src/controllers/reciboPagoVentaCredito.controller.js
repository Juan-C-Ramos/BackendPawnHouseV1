// controllers/pdf/reciboPagoVentaCredito.controller.js

const PDFDocument = require("pdfkit");

const {
  Payment,
  Transaction,
  Customer,
  User,
  Cuotes,
} = require("../models");

const HistorialSaldo = require("../models/HistorialSaldo");
const PaymentUsers = require("../models/PaymentsUsers");

const generarReciboPagoVentaCreditoPDF = async (req, res) => {
  try {
    const { pagoId } = req.params;

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
      return res.status(404).json({ message: "Pago no encontrado" });
    }

    const historial = await HistorialSaldo.findOne({
      where: { pagoId: pago.id },
    });

    const paymentUser = await PaymentUsers.findOne({
      where: { paymentId: pago.id },
    });

    let usuario = null;
    if (paymentUser) {
      usuario = await User.findByPk(paymentUser.userId);
    }

    const transaccion = pago.transaction;
    const cliente = transaccion?.customer;

    // ===== Montos del pago =====
    const pagoContrato = Number(pago.capital || 0); // abono al contrato
    const pagoMorosidad = Number(pago.layPaymentFee || 0);
    const totalPagado = Number(pago.amount || 0);

    // ===== Saldo contrato =====
    // Preferir historial; si no, reconstruir con capital de cuotas
    const cuotas = transaccion?.transactionCuotes || [];
    const saldoContratoActual = Number(
      historial?.nuevoSaldo ??
        cuotas.reduce((acc, c) => acc + Number(c.capitalAmount || 0), 0)
    );

    const saldoContratoAnterior = Number(
      historial?.saldoAnterior ?? saldoContratoActual + pagoContrato
    );

    // ===== Morosidad =====
    // Después del pago queda la de la transacción
    const morosidadActual = Number(transaccion?.morosidadAmount || 0);
    const morosidadAnterior = morosidadActual + pagoMorosidad;

    // ====================================
    // PDF (ticket)
    // ====================================
    const doc = new PDFDocument({
      size: [198, 700],
      margin: 10,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="recibo_venta_${pago.id}.pdf"`
    );

    doc.pipe(res);

    // ENCABEZADO
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("LIR Tecnología a la Vanguardia", { align: "center" });

    doc.fontSize(8).font("Helvetica").text(" ", { align: "center" });

    doc
      .fontSize(8)
      .text("RUC 1556557158-2-2017 DV 56", { align: "center" });

    doc.moveDown(1.5);

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("RECIBO DE COBRO", { align: "center" });

    doc.moveDown(0.8);

    // DATOS GENERALES
    doc.fontSize(10).font("Helvetica");

    doc.text(`RECIBO N°: ${pago.id}`);
    doc.text(`CONTRATO: ${transaccion?.contractNumber || "-"}`);
    doc.text(`FECHA: ${pago.paymentDate}`);
    doc.moveDown(0.5);

    doc.text(
      `CLIENTE: ${cliente?.firstName || ""} ${cliente?.lastName || ""}`
    );
    doc.text(`METODO: ${pago.paymentMethod || "-"}`);
    doc.moveDown(0.5);

    doc.text("-----------------------------------------------------", {
      align: "center",
    });

    doc.moveDown(0.3);
    doc.text("CONCEPTO: Pago de venta a crédito");
    doc.moveDown(0.5);

    // Línea helper
    const linea = (label, valor) => {
      doc.text(label, 10, doc.y, { continued: true });
      doc.text(`B/. ${Number(valor || 0).toFixed(2)}`, { align: "right" });
    };

    const separador = () => {
      doc.moveDown(0.3);
      doc.text("-----------------------------------------------------", {
        align: "center",
      });
      doc.moveDown(0.3);
    };

    // ===== SALDO ANTERIOR =====
    doc.font("Helvetica-Bold").text("SALDO ANTERIOR");
    doc.font("Helvetica");
    linea("Contrato", saldoContratoAnterior);
    linea("Morosidad", morosidadAnterior);

    separador();

    // ===== PAGO =====
    doc.font("Helvetica-Bold").text("PAGO");
    doc.font("Helvetica");
    linea("Contrato", pagoContrato);
    linea("Morosidad", pagoMorosidad);

    doc.moveDown(0.3);
    doc.font("Helvetica-Bold");
    linea("TOTAL PAGADO", totalPagado);
    doc.font("Helvetica");

    separador();

    // ===== SALDO NUEVO =====
    doc.font("Helvetica-Bold").text("SALDO NUEVO");
    doc.font("Helvetica");
    linea("Contrato", saldoContratoActual);
    linea("Morosidad", morosidadActual);

    doc.moveDown(4);

    // FIRMA
    const firmaY = doc.y;
    doc.moveTo(15, firmaY).lineTo(180, firmaY).stroke();
    doc.moveDown(0.3);

    doc.fontSize(8).font("Helvetica");
    doc.text("RECIBIDO POR", { align: "center" });
    doc.text(
      usuario
        ? `${usuario.firstName} ${usuario.lastName}`
        : "Sistema",
      { align: "center" }
    );

    doc.end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error generando recibo PDF de venta a crédito",
      error: error.message,
    });
  }
};

module.exports = {
  generarReciboPagoVentaCreditoPDF,
};