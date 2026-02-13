const PDFDocument = require("pdfkit");

const generarDeclaracionPertenencia = async (req, res) => {
  try {
    const { cliente, prenda } = req.body;

    const doc = new PDFDocument({ size: "LEGAL", margin: 70 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="declaracion_pertenencia.pdf"'
    );

    doc.pipe(res);

    // ================== TÍTULO ==================
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("DECLARACIÓN JURADA", { align: "center" });

    doc.moveDown(2);

    // Nombre completo del cliente
    const nombreCompleto = `${cliente?.firstName || ""} ${
      cliente?.lastName || ""
    }`.trim();

    // Dirección completa
    const direccionCompleta = [
      cliente?.addressProvincia,
      cliente?.addressDistrito,
      cliente?.addressCorregimiento,
      cliente?.addressBarrio,
      cliente?.addressCalle,
      cliente?.addressCasa,
    ]
      .filter(Boolean)
      .join(", ");

    // ================== PÁRRAFO INICIAL CON LÍNEAS ==================
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Yo, ${nombreCompleto}, mayor de edad, portador de la cédula y/o pasaporte de identidad personal No. ${cliente?.numberID}, con domicilio en ${direccionCompleta}, por este medio y bajo la gravedad del juramento, declaro lo siguiente:`,
        { align: "justify", lineGap: 4 }
      );

    doc.moveDown(1.5);

    // ================== PRIMERO ==================
    doc
      .font("Helvetica-Bold")
      .text("PRIMERO:")
      .font("Helvetica")
      .text(
        "Que he entregado a LIR TECNOLOGÍA A LA VANGUARDIA, S.A., con domicilio en Panamá, Ciudad de Panamá, Bellavista, Vía España, Edificio Plaza Concordia, Oficina 207, el bien descrito a continuación, en calidad de garantía prendaria conforme al contrato de prenda suscrito en esta misma fecha:",
        { align: "justify", lineGap: 4 }
      );

    doc.moveDown(1);

    // ================== DESCRIPCIÓN DEL BIEN ==================
    doc.font("Helvetica-Bold").text("Descripción del bien:");
    doc.moveDown(0.5);

    doc
      .font("Helvetica")
      .text(`• Nombre: ${prenda.nombre}`)
      .text(`• Descripción: ${prenda.descripcion}`)
      .text(`• Categoría: ${prenda.categoria}`)
      .text(
        `• Valor estimado: B/. ${Number(prenda.valorEstimado).toFixed(2)}`
      );

    if (prenda.categoria === "Joyería") {
      doc.text(`• Kilataje: ${prenda.kilateje || "N/A"}`);
      doc.text(`• Peso (g): ${prenda.pesoGramos || "N/A"}`);
    }

    doc.moveDown(1.5);

    // ================== SEGUNDO ==================
    doc
      .font("Helvetica-Bold")
      .text("SEGUNDO:")
      .font("Helvetica")
      .text(
        "Que soy el propietario legítimo del bien descrito, y que el mismo no proviene de actividad ilícita, no se encuentra gravado, ni ha sido objeto de reclamo o denuncia alguna por robo, pérdida o apropiación indebida.",
        { align: "justify", lineGap: 4 }
      );

    doc.moveDown(1);

    // ================== TERCERO ==================
    doc
      .font("Helvetica-Bold")
      .text("TERCERO:")
      .font("Helvetica")
      .text(
        "Que comprendo y acepto que esta declaración jurada no sustituye ni modifica el contrato de prenda suscrito con la casa de empeño, sino que lo complementa, confirmando que toda la información que he proporcionado es cierta y veraz.",
        { align: "justify", lineGap: 4 }
      );

    doc.moveDown(1);

    // ================== CUARTO ==================
    doc
      .font("Helvetica-Bold")
      .text("CUARTO:")
      .font("Helvetica")
      .text(
        "Que reconozco haber sido informado de las condiciones generales y particulares del contrato de prenda, incluyendo los plazos de redención, intereses aplicables, valor estimado del bien y consecuencias del incumplimiento, y que manifiesto mi plena conformidad con dichas condiciones.",
        { align: "justify", lineGap: 4 }
      );

    doc.moveDown(1);

    // ================== QUINTO ==================
    doc
      .font("Helvetica-Bold")
      .text("QUINTO:")
      .font("Helvetica")
      .text(
        "Que autorizo expresamente a la casa de empeño a conservar copia de la presente declaración junto con el contrato de prenda, y a utilizarla como medio de prueba en caso de controversia o verificación de la procedencia del bien.",
        { align: "justify", lineGap: 4 }
      );

    doc.moveDown(1);

    // ================== SEXTO ==================
    doc
      .font("Helvetica-Bold")
      .text("SEXTO:")
      .font("Helvetica")
      .text(
        "Que declaro haber comprendido el contenido de esta declaración jurada antes de firmarla, y que la firmo libre y voluntariamente, sin haber sido objeto de coacción, presión o engaño.",
        { align: "justify", lineGap: 4 }
      );

    doc.moveDown(1);

    // ================== SÉPTIMO ==================
    doc
      .font("Helvetica-Bold")
      .text("SÉPTIMO:")
      .font("Helvetica")
      .text(
        "Que me comprometo a responder por cualquier falsedad o inexactitud contenida en esta declaración, reconociendo que puede dar lugar a responsabilidades civiles o penales conforme a la ley.",
        { align: "justify", lineGap: 4 }
      );

    doc.moveDown(2);

   // ======== FECHA FINAL AUTOMÁTICA ========
const hoy = new Date();

const dia = hoy.getDate();
const mes = hoy.toLocaleString("es-ES", { month: "long" }); // mes en letras
const anio = hoy.getFullYear();

doc.text(
  `En fe de lo cual firmo la presente declaración en la ciudad de Panamá a los ${dia} días del mes de ${mes} de ${anio}.`,
  { align: "justify", lineGap: 4 }
);

doc.moveDown(3);


    // ================== FIRMAS ==================
    const firmaY = doc.y;

    // Firma del declarante (izquierda)
    doc.text("______________________________", 60, firmaY);
    doc.text("Firma del Declarante", 60, firmaY + 15);
    doc.text("Nombre: ____________________________", 60, firmaY + 35);
    doc.text("Cédula: ____________________________", 60, firmaY + 55);
    doc.text("Teléfono: __________________________", 60, firmaY + 75);

    // Firma del testigo (derecha)
    doc.text("______________________________", 320, firmaY);
    doc.text("Firma del Testigo (Ejecutivo de la Empresa)", 320, firmaY + 15);
    doc.text("Nombre: ____________________________", 320, firmaY + 35);
    doc.text("Cédula: ____________________________", 320, firmaY + 55);
    doc.text("Cargo: ____________________________", 320, firmaY + 75);

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generando el PDF" });
  }
};

module.exports = { generarDeclaracionPertenencia };
