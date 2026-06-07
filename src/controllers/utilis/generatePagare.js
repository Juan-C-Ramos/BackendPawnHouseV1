const PDFDocument = require("pdfkit");
const path = require("path");
const numberToText = require("../utils/numberToText");

const getPagare = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findByPk(id, {
      include: [Customer],
    });

    if (!transaction) {
      return res.status(404).json({ message: "No encontrado" });
    }

    const customer = transaction.customer;

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=pagare-${transaction.contractNumber}.pdf`
    );

    doc.pipe(res);

    const amountLetter = numberToText(transaction.capital || 0);

    const fecha = transaction.startDate.split("-");
    const dia = fecha[2];
    const mes = fecha[1];
    const año = fecha[0];

    // 🔹 LOGO
    try {
      doc.image(path.join(__dirname, "../assets/logoVFinal.png"), 50, 40, {
        width: 100,
      });
    } catch (e) {}

    // 🔹 TÍTULO
    doc
      .fontSize(16)
      .text(`PAGARÉ ${transaction.contractNumber}`, 200, 60);

    doc
      .fontSize(10)
      .text(`Panamá, ${dia} de ${mes} de ${año}`, 200, 80);

    doc.moveDown(2);

    // 🔹 PRESTAMISTA
    doc.font("Helvetica-Bold").text("PRESTAMISTA:");
    doc.font("Helvetica").text(
      "Razón Social: LIR TECNOLOGÍA A LA VANGUARDIA, S.A. RUC: 155657158-2-2017 DV 56 Dirección: Ciudad de Panamá, Bella Vista, Via España, Plaza Concordia oficina 247 Teléfono: 211-3178, Representante: ISRAEL RODRIGUEZ WARREN, Cédula: 1-703-206"
    );

    doc.moveDown();

    // 🔹 PRESTATARIO
    doc.font("Helvetica-Bold").text("PRESTATARIO:");
    doc.font("Helvetica").text(
      `Nombre: ${customer?.firstName} ${customer?.lastName} Cédula: ${
        customer?.numberID
      }, Dirección: ${[
        customer?.addressProvincia,
        customer?.addressDistrito,
        customer?.addressCorregimiento,
        customer?.addressBarrio,
        customer?.addressCalle,
        customer?.addressCasa,
      ]
        .filter(Boolean)
        .join(", ")}, Teléfono: ${customer?.phone}`
    );

    doc.moveDown();

    // 🔹 MONTO
    doc.font("Helvetica-Bold").text("Monto a Prestar:");
    doc.font("Helvetica").text(
      `B/. ${transaction.capital?.toFixed(
        2
      )} En letras: ${amountLetter}`
    );

    doc.moveDown();

    // 🔹 CONDICIONES
    doc.font("Helvetica-Bold").text(
      "Plazo, intereses causados y recargos de morosidad:"
    );

    doc.font("Helvetica").text(
      `Cuotas quincenales: ${
        transaction.cuotes || 0
      } ITBMS 7% sobre intereses, Interés: ${
        transaction.interestsPorcent
      }%, Recargo morosidad: 20%`
    );

    doc.moveDown();

    // 🔹 FECHAS
    doc.font("Helvetica-Bold").text("Fecha y forma de pago");
    doc.font("Helvetica").text(
      `Inicio: ${transaction.startDate}, Finalización: ${
        transaction.endDate || "-"
      }, Días de gracia: 3`
    );

    doc.text(
      `Monto por cuota: ${transaction.cuotaMinima?.toFixed(
        2
      )}, pagos en efectivo o depósito`
    );

    doc.moveDown();

    // 🔹 CLÁUSULAS (1–6)
    const clausulas = [
      "Cláusula uno: Por el monto recibido...",
      "Cláusula dos: Este pagaré deberá pagarse...",
      "Cláusula tres: Cuando el cliente realice un pago...",
      "Cláusula cuatro: El prestatario podrá pagar...",
      "Cláusula cinco: Si el prestatario incumple...",
      "Cláusula seis: El prestatario será responsable...",
    ];

    clausulas.forEach((c) => {
      doc.moveDown(0.5);
      doc.text(c);
    });

    // 🔥 NUEVA PÁGINA
    doc.addPage();

    const clausulas2 = [
      "Cláusula siete: Recargo de morosidad...",
      "Cláusula ocho: El prestamista podrá ejecutar...",
      "Cláusula nueve: La invalidez de alguna cláusula...",
      "Cláusula diez: Regido por leyes de Panamá.",
      "Cláusula once: Aplicable a herederos...",
    ];

    clausulas2.forEach((c) => {
      doc.moveDown(0.5);
      doc.text(c);
    });

    doc.moveDown(2);

    // 🔹 FIRMAS
    doc.text(
      `Para constancia se firma en Panamá a los ${dia} días del mes de ${mes} de ${año}.`
    );

    doc.moveDown(4);

    doc.text("Prestamista", 50);
    doc.text("Prestatario", 300);

    doc.moveDown(2);

    doc.text("________________________", 50);
    doc.text("________________________", 300);

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generando pagaré" });
  }
};