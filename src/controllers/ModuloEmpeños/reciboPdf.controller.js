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

doc.text(`RECIBO N°: ${pago.numeroPago}`);
doc.text(`FECHA: ${pago.fechaPago.toISOString().split("T")[0]}`);
console.log("Fecha del pago:", pago.fechaPago);

doc.moveDown(0.5);

doc.text(`CLIENTE: ${cliente.firstName} ${cliente.lastName}`);
doc.text(`METODO: ${pago.metodoPago}`);

doc.moveDown(0.5);

// =================== SEPARADOR ===================
doc.fontSize(9);
doc.text("-----------------------------------------------------------", { align: "center" });

doc.moveDown(0.3);

doc.text("CONCEPTO: Pago de cuota");

doc.moveDown(0.3);

// =================== SALDOS ANTERIORES ===================
doc.font("Helvetica-Bold").text("SALDOS ANTERIORES");
doc.font("Helvetica");

doc.text(`Capital`, 10, doc.y, { continued: true });
doc.text(`B/. ${Number(pago.montoCapitalAnterior || 0).toFixed(2)}`, {
  align: "right",
});

doc.text(`Interés`, 10, doc.y, { continued: true });
doc.text(`B/. ${Number(pago.montoInteresAnterior || 0).toFixed(2)}`, {
  align: "right",
});

doc.text(`Morosidad`, 10, doc.y, { continued: true });
doc.text(`B/. ${Number(pago.montoMorosidadAnterior || 0).toFixed(2)}`, {
  align: "right",
});

doc.moveDown(0.5);

// =================== SEPARADOR ===================
doc.text("-----------------------------------------------------------", { align: "center" });

doc.moveDown(0.4);

// =================== DETALLES DEL PAGO ===================
doc.font("Helvetica-Bold").text("DETALLE DEL PAGO");
doc.font("Helvetica");

doc.text(`Abono Capital`, 10, doc.y, { continued: true });
doc.text(`B/. ${Number(pago.montoCapital).toFixed(2)}`, { align: "right" });

doc.text(`Abono Interés`, 10, doc.y, { continued: true });
doc.text(`B/. ${Number(pago.montoInteres).toFixed(2)}`, { align: "right" });

doc.text(`Morosidad`, 10, doc.y, { continued: true });
doc.text(`B/. ${Number(pago.montoMorosidad).toFixed(2)}`, { align: "right" });

doc.text(`ITBMS (7%)`, 10, doc.y, { continued: true });
doc.text(`B/. ${Number(pago.montoITBMS).toFixed(2)}`, { align: "right" });

doc.moveDown(0.5);

// =================== SEPARADOR ===================
doc.text("-----------------------------------------------------------", { align: "center" });

doc.moveDown(0.4);

// =================== TOTAL ===================
doc
  .fontSize(11)
  .font("Helvetica-Bold")
  .text(`TOTAL PAGADO`, 10, doc.y, { continued: true });

doc.text(`B/. ${Number(pago.montoTotalPago).toFixed(2)}`, {
  align: "right",
});

doc.moveDown(0.6);

// =================== SEPARADOR ===================
doc.fontSize(9).font("Helvetica");
doc.text("-----------------------------------------------------------", { align: "center" });

doc.moveDown(0.4);

// =================== SALDOS NUEVOS ===================
doc.font("Helvetica-Bold").text("SALDOS ACTUALES");
doc.font("Helvetica");

doc.text(`Capital`, 10, doc.y, { continued: true });
doc.text(`B/. ${Number(pago.montoCapitalNuevo || 0).toFixed(2)}`, {
  align: "right",
});

doc.text(`Interés`, 10, doc.y, { continued: true });
doc.text(`B/. ${Number(pago.montoInteresNuevo || 0).toFixed(2)}`, {
  align: "right",
});

doc.text(`Morosidad`, 10, doc.y, { continued: true });
doc.text(`B/. ${Number(pago.montoMorosidadNuevo || 0).toFixed(2)}`, {
  align: "right",
});

    doc.moveDown(0.4);

    

    doc.moveDown(4);

    // =================== LÍNEA Y FIRMA ===================
    const firmaY = doc.y;

    doc.moveTo(15, firmaY).lineTo(180, firmaY).stroke();

    doc.moveDown(0.3);
    doc.fontSize(8).font("Helvetica");
    doc.text("RECIBIDO POR", { align: "center" });
    doc.text(`${usuario.firstName} ${usuario.lastName}`, { align: "center" });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generando recibo en PDF" });
  }
};

module.exports = { generarReciboPagoPDF };
