// controllers/contratoPdf.controller.js
const PDFDocument = require("pdfkit");
const path = require("path");

const generarContratoEmpenoPDF = async (req, res) => {
  try {
    const { contrato, prendas, cliente } = req.body;
    const logoPath = path.join(__dirname, "../../logoVFinal.png");

    // 8.5 x 5.5 pulgadas = 612 x 396 puntos
    const doc = new PDFDocument({
      size: [612, 396],
      margin: 25,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="contrato_empeno.pdf"',
    );

    doc.pipe(res);

    // ===================== FUNCIÓN QUE DIBUJA UNA HOJA COMPLETA =====================
    const dibujarHoja = (doc, textoCopia) => {
      // ---------- Marca de agua (tu misma) ----------
      doc.save();
      doc.opacity(0.1);

      doc.image(logoPath, 200, 100, {
        width: 200,
        align: "center",
      });

      doc.restore();

      // ===================== ENCABEZADO =====================

      // LOGO izquierda
      doc.image(logoPath, 30, 20, {
        width: 90,
        height: 70,
      });

      // Título principal
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("CONTRATO CASA DE EMPEÑOS LIR EXPRESS", 1, 25, {
          align: "center",
        });

      doc
        .fontSize(8)
        .font("Helvetica")
        .text("Resolución No. 574 del 22 de agosto de 2025", 1, 40, {
          align: "center",
        });

      doc.text("LIR TECNOLOGIA A LA VANGUARDIA, S.A.", 1, 52, {
        align: "center",
      });
      doc.text("RUC 1556557158-2-2017 DV 56", 1, 62, {
        align: "center",
      });

      // Cuadro de No. de Contrato + Fecha
      doc.rect(450, 20, 130, 60).stroke();
      doc.fontSize(8).text("No. de Contrato:", 455, 30);
      doc.text(contrato?.numeroContrato || "N/A", 455, 40);
      doc.text("Fecha:", 455, 55);
      const fecha = contrato?.fechaContrato
  ? new Date(contrato.fechaContrato)
      .toLocaleDateString("es-PA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
  : "N/A";

doc.text(fecha, 500, 55);

      // ===================== DATOS DE LUGAR =====================
      doc.moveTo(30, 100).stroke();

      doc
        .fontSize(8)
        .text(
          "LUGAR: Panamá, Rep. de Panamá, Ave España, Plaza Concordia, Oficina 247",
          30,
          105,
        );

      doc.text(
        "TELÉFONO/FAX: 277 0036   CORREO: lirtecnologia@hotmail.com",
        30,
        118,
      );

      // ===================== DATOS DEL CLIENTE =====================
      doc.moveTo(30, 100).stroke();

      const nombreCompleto = `${cliente.firstName} ${cliente.lastName}`;

      doc.fontSize(8).text("NOMBRE DEL PRESTATARIO (Cliente):", 30, 130);
      doc.text(nombreCompleto, 200, 130);

      doc.text("CÉDULA/PASAPORTE:", 380, 130);
      doc.text(cliente.numberID || "", 480, 130);

      doc.text("TELÉFONO:", 380, 140);
      doc.text(cliente.phone || "", 480, 140);

      // Dirección
      const direccionCompleta = [
        cliente.addressProvincia,
        cliente.addressDistrito,
        cliente.addressCorregimiento,
        cliente.addressBarrio,
        cliente.addressCalle,
        cliente.addressCasa,
      ]
        .filter(Boolean)
        .join(", ");

      doc.text("DIRECCIÓN:", 30, 145);
      doc.text(direccionCompleta || "", 120, 145);

      // ===================== DESCRIPCIÓN DE PRENDAS =====================
      doc.moveTo(30, 160).stroke();

      doc
        .fontSize(8)
        .text("DESCRIPCIÓN DE LA(S) GARANTÍA(S) PRENDARIA(S):", 30, 155);

      let y = 165;
      prendas.forEach((p, i) => {
        doc.text(
          `${i + 1}. ${p.nombre} - ${p.descripcion} (${p.categoria}) - B/. ${Number(
            p.valorEstimado,
          ).toFixed(2)}`,
          40,
          y,
        );

        if (p.categoria === "Joyería") {
          doc.text(
            `Kilate: ${p.kilateje || "N/A"}   |   Gramos: ${
              p.pesoGramos || "N/A"
            }`,
            60,
            y + 10,
          );
          y += 20;
        } else {
          y += 15;
        }

        // ===================== CHECKBOXES FACTURA / DECLARACIÓN =====================
        doc.text(
          "INDICACIÓN DE LA PRUEBA DE LA GARANTÍA PRENDARIA:",
          30,
          y + 10,
        );

        // valida si existe factura original
        const tieneFacturaOriginal =
          p.facturaOriginalNumero &&
          p.facturaOriginalNumero.toString().trim() !== "";

        // ---------- CHECKBOX FACTURA ----------

        doc.rect(30, y + 20, 10, 10).stroke();

        if (tieneFacturaOriginal) {
          // marca la casilla
          doc.text("X", 32, y + 20);

          // muestra el número
          doc.text(`Factura No. ${p.facturaOriginalNumero}`, 45, y + 20);
        } else {
          // línea vacía
          doc.text("Factura No. ____________________", 45, y + 20);
        }

        // ---------- CHECKBOX DECLARACIÓN ----------

        doc.rect(30, y + 35, 10, 10).stroke();

        if (!tieneFacturaOriginal) {
          // marca la casilla de declaración
          doc.text("X", 32, y + 35);
        }

        doc.text(
          'Declaración: "Yo declaro y aseguro, bajo juramento, que la garantía prendaria es de mi propiedad".',
          45,
          y + 35,
          {
            width: 500,
          },
        );
      });

      // Líneas tipo formulario
      doc.moveTo(30, y + 5).stroke();
      doc.moveTo(30, y + 20).stroke();

      // ===================== MONTOS Y CONDICIONES =====================
      doc.moveTo(30, y + 50).stroke();

      doc
        .fontSize(8)
        .text(
          `MONTO DEL PRÉSTAMO: B/. ${Number(contrato.montoPrestamo).toFixed(
            2,
          )}`,
          30,
          y + 50,
        );

      doc.text(
        `MONTO MÁXIMO A PRESTAR: B/. ${Number(
          contrato.montoMaximoaPrestar,
        ).toFixed(2)}`,
        30,
        y + 60,
      );

      doc.text(
        `TASA DE INTERÉS MENSUAL: ${
          contrato.tasaInteres
        }%   |   TASA EFECTIVA: ${
          contrato.interesMensualEfectivo || contrato.tasaInteres
        }%`,
        30,
        y + 70,
      );

      doc.text(
        `PLAZO: ${contrato.plazoMeses} meses   |   PERIODO DE GRACIA: ${contrato.periodoGraciaDias} días`,
        30,
        y + 80,
      );

      doc.text(
        `En caso de no retirar el producto empeñado personalmente, autorizo a: ${
          contrato.autorizado || "N/A"
        } con cédula no. ${contrato.autorizadoID || "N/A"}`,
        30,
        y + 90,
      );

      doc.text(
        `Declara el prestatario (cliente) estar de acuerdo con el monto prestado, monto máximo a prestar, intereses y el plazo; y acepta expresamente este Contrato de Empeño, en todos los términos y condiciones DESCRITOS AL FRENTE Y AL REVERSO y prueba de ello lo firma a voluntad.`,
        30,
        y + 100,
      );

      // ===================== FIRMAS =====================
      doc.moveTo(30, 350).lineTo(200, 350).stroke();
      doc.text("Firma del prestatario (cliente)", 30, 355);

      doc.moveTo(230, 350).lineTo(400, 350).stroke();
      doc.text("Firma Autorizado a Retirar", 230, 355);

      doc.moveTo(420, 350).lineTo(580, 350).stroke();
      doc.text("Firma y Sello Casa de Empeño", 420, 355);

      // ======= TEXTO FINAL (ÚNICA COSA QUE CAMBIA) =======
      doc
        .fontSize(5)
        .font("Helvetica-Oblique")
        .text(textoCopia, 20, 365, { align: "left" });

      doc.font("Helvetica").fontSize(8);
    };

    // ===================== GENERAMOS LAS 3 HOJAS =====================

    dibujarHoja(doc, "Copia para el cliente");

    doc.addPage();
    dibujarHoja(doc, "Copia para archivo");

    doc.addPage();
    dibujarHoja(doc, "Copia para bodega");

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generando el contrato en PDF" });
  }
};

module.exports = { generarContratoEmpenoPDF };
