// controllers/reciboPagoPdf.controller.js
const PDFDocument = require("pdfkit");
const path = require("path");
const { Pagos, ContratoEmpeno, Customer, User } = require("../../models"); // ajusta tu ruta

const generarReciboPagoPDF = async (req, res) => {
  try {
    const { pagoId } = req.params;
    console.log("Generando recibo para pago ID:", pagoId);

    // Buscar el pago con relaciones
    const pago = await Pagos.findByPk(pagoId, {
      include: [
        {
          model: ContratoEmpeno,
          include: [{ model: Customer } ],
        },
        {
          model: User,
        },
      ],
    });

    const usuario = await User.findByPk(pago.userId);

    console.log("Pago encontrado:", pago ? pago.toJSON() : "No se encontró el pago");
    console.log("Usuario encontrado:", usuario ? usuario.toJSON() : "No se encontró el usuario");

    if (!pago) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }

    const contrato = pago.contratoEmpeno;
    const cliente = contrato.customer;

    const logoPath = path.join(__dirname, "../../logoVFinal.png");

    // ======== TAMAÑO TICKET (7cm ≈ 198 puntos) ========
    const doc = new PDFDocument({
      size: [198, 600], // ancho fijo, alto dinámico
      margin: 10,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="recibo_pago_${pago.numeroPago}.pdf"`,
    );

    doc.pipe(res);

    // =================== ENCABEZADO (CENTRADO Y LIMPIO) ===================
    doc.image(logoPath, 65, 10, { width: 70 });
    doc.moveDown(5.5);

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("LIR Express", { align: "center" });

    doc
      .fontSize(8)
      .font("Helvetica")
      .text("Resolución No. 574 del 22 de agosto de 2025", { align: "center" });
    doc
      .fontSize(8)
      .font("Helvetica")
      .text("Casa de empeño", { align: "center" });

    doc
      .fontSize(8)
      .font("Helvetica")
      .text("RUC 1556557158-2-2017 DV 56", { align: "center" });

    doc.moveDown(1.5);

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("RECIBO DE COBRO", { align: "center" });

    doc.moveDown(0.8);

    // =================== DATOS DEL RECIBO ===================
    doc.fontSize(10).font("Helvetica");

    doc.text(`RECIBO N°: ${pago.numeroPago}`, { align: "left" });
    doc.text(`FECHA: ${pago.fechaPago.toISOString().split("T")[0]}`, {
      align: "left",
    });
    console.log("Fecha del pago:", pago.fechaPago);

    doc.moveDown(1);

    doc.text(`Recibí de: ${cliente.firstName} ${cliente.lastName}`, {
      align: "left",
    });
    doc.moveDown(0.6);

    doc.text(`Método de pago: ${pago.metodoPago}`, { align: "left" });

    doc.moveDown(0.4);
    doc.text("Concepto: Pago de cuota", { align: "left" });
    doc.moveDown(0.4);
    doc.text(`Saldo capital Actual: B/. ${Number(pago.montoCapitalAnterior || 0).toFixed(2)}`, { align: "left" });
    doc.moveDown(0.4);
    doc.text(`Saldo intereses Actual: B/. ${Number(pago.montoInteresAnterior || 0).toFixed(2)}`, { align: "left" });
    doc.moveDown(0.4);
    doc.text(`Saldo morosidad Actual: B/. ${Number(pago.montoMorosidadAnterior || 0).toFixed(2)}`, { align: "left" });

    doc.moveDown(0.6);

    // =================== DETALLE DE MONTOS ===================
    doc.text(`Detalles`, {
      align: "center",
    });
    // =================== TOTAL (DESTACADO) ===================
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(`TOTAL: B/. ${Number(pago.montoTotalPago).toFixed(2)}`, {
        align: "left",
      });
      doc.fontSize(10).font("Helvetica");
    doc.text(`Abono a Capital: B/. ${Number(pago.montoCapital).toFixed(2)}`, {
      align: "left",
    });
    doc.text(`Abono a Interés: B/. ${Number(pago.montoInteres).toFixed(2)}`, {
      align: "left",
    });
    doc.text(`Monto Morosidad: B/. ${Number(pago.montoMorosidad).toFixed(2)}`, {
      align: "left",
    });
    doc.text(`ITBMS (7%): B/. ${Number(pago.montoITBMS).toFixed(2)}`, {
      align: "left",
    });

    doc.moveDown(0.6);

    // =================== SALDO ===================
    doc.text(`Saldo capital nuevo: B/. ${Number(pago.montoCapitalNuevo || 0).toFixed(2)}`, {
      align: "left",
    });

    doc.moveDown(0.4);
    doc.text(`Saldo intereses nuevo: B/. ${Number(pago.montoInteresNuevo || 0).toFixed(2)}`, {
      align: "left",
    });

    doc.moveDown(0.4);
    doc.text(`Saldo morosidad nuevo: B/. ${Number(pago.montoMorosidadNuevo || 0).toFixed(2)}`, {
      align: "left",
    });

    doc.moveDown(0.4);

    

    doc.moveDown(4);

    // =================== LÍNEA Y FIRMA ===================
    const firmaY = doc.y;

    doc.moveTo(15, firmaY).lineTo(180, firmaY).stroke();

    doc.moveDown(0.3);
    doc.fontSize(8).font("Helvetica");
    doc.text("RECIBIDO POR", { align: "center" });
    // doc.text(`${usuario.firstName} ${usuario.lastName}`, { align: "center" });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generando recibo en PDF" });
  }
};

module.exports = { generarReciboPagoPDF };
