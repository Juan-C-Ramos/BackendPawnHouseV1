// controllers/contratoPrestamoCuotaFija.controller.js
const PDFDocument = require("pdfkit");
const path = require("path");
const {
  Transaction,
  Customer,
  Cuotes,
} = require("../models"); // Ajusta la ruta según tu estructura

// ===================== HELPERS =====================
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatearFechaLarga(fecha) {
  if (!fecha) return "_____ de ________ de 20____";
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "_____ de ________ de 20____";
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

function formatearFechaCorta(fecha) {
  if (!fecha) return "_______________";
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "_______________";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function numeroALetras(num) {
  if (num === undefined || num === null || isNaN(Number(num))) return "_______________";
  const n = Math.floor(Number(num));
  if (n === 0) return "CERO";

  const unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const especiales = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"];
  const decenas = ["", "", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const centenas = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

  if (n < 10) return unidades[n];
  if (n < 20) return especiales[n - 10];
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    if (u === 0) return decenas[d];
    if (d === 2) return "VEINTI" + unidades[u];
    return decenas[d] + " Y " + unidades[u];
  }
  if (n < 1000) {
    const c = Math.floor(n / 100);
    const resto = n % 100;
    if (c === 1 && resto === 0) return "CIEN";
    return centenas[c] + (resto ? " " + numeroALetras(resto) : "");
  }
  if (n < 1000000) {
    const miles = Math.floor(n / 1000);
    const resto = n % 1000;
    const milesStr = miles === 1 ? "MIL" : numeroALetras(miles) + " MIL";
    return milesStr + (resto ? " " + numeroALetras(resto) : "");
  }
  return n.toString();
}

function toFixed2(val) {
  return Number(val || 0).toFixed(2);
}

// ===================== CONTROLADOR =====================
const generarContratoPrestamoCuotaFijaPDF = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "El id de la transacción es requerido" });
    }

    const transaction = await Transaction.findByPk(id, {
      include: [
        { model: Customer },
        { model: Cuotes, as: "transactionCuotes" },
      ],
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transacción no encontrada" });
    }

    if (transaction.transactionType !== "prestamos" && transaction.transactionType !== "refinanciamiento") {
      return res.status(400).json({
        message: `Esta transacción es de tipo "${transaction.transactionType}". Este contrato solo aplica a préstamos y refinanciamiento.`,
      });
    }

    const cliente = transaction.Customer || transaction.customer;
    if (!cliente) {
      return res.status(400).json({ message: "La transacción no tiene cliente asociado" });
    }

    // ---------- MAPEAR DATOS ----------
    const nombreCompleto = `${cliente.firstName || ""} ${cliente.lastName || ""}`.trim();
    const cedula = cliente.numberID || "______________";
    const telefono = cliente.phone || "_________________";
    const email = cliente.email || "_________________________________";
    const nacionalidad = cliente.nacionality || "panameño(a)";

    const direccionCompleta =
      [
        cliente.addressProvincia,
        cliente.addressDistrito,
        cliente.addressCorregimiento,
        cliente.addressBarrio,
        cliente.addressCalle,
        cliente.addressCasa,
      ]
        .filter(Boolean)
        .join(", ") || "______________________________";

    const capital = Number(transaction.amonunt || transaction.capital || 0);
    const capitalStr = toFixed2(capital);
    const capitalLetras = `${numeroALetras(capital)} BALBOAS`.toUpperCase();

    const tasaInteres = Number(transaction.interestsPorcent || 0);
    const tasaStr = tasaInteres.toString();

    const montoIntereses = Number(transaction.interestAmount || 0);
    const montoInteresesStr = toFixed2(montoIntereses);

    const numCuotas = transaction.cuotes || transaction.transactionCuotes?.length || 0;
    const valorCuota = Number(transaction.cuotesAmount || 0);
    const valorCuotaStr = toFixed2(valorCuota);

    const montoTotalObligacion = capital + montoIntereses;
    const montoTotalStr = toFixed2(montoTotalObligacion);
    const montoTotalLetras = `${numeroALetras(montoTotalObligacion)} BALBOAS`.toUpperCase();

    const fechaInicio = transaction.startDate
      ? new Date(transaction.startDate)
      : new Date();
    const dia = fechaInicio.getDate();
    const mesNombre = MESES[fechaInicio.getMonth()];
    const anio = fechaInicio.getFullYear();
    const fechaInicioStr = formatearFechaCorta(transaction.startDate);

    let fechaVencimientoStr = formatearFechaCorta(transaction.endDate);
    let fechaUltimaLarga = formatearFechaLarga(transaction.endDate);

    if (transaction.transactionCuotes?.length > 0) {
      const ordenadas = [...transaction.transactionCuotes].sort(
        (a, b) => new Date(a.paymentCutDate) - new Date(b.paymentCutDate)
      );
      const ultima = ordenadas[ordenadas.length - 1].paymentCutDate;
      if (!transaction.endDate) {
        fechaVencimientoStr = formatearFechaCorta(ultima);
        fechaUltimaLarga = formatearFechaLarga(ultima);
      }
    }

    const numeroContrato = transaction.contractNumber || `CF-${transaction.id}`;

    // ---------- GENERAR PDF (Legal 8.5 x 14) ----------
    const logoPath = path.join(__dirname, "../../logoVFinal.png");

    const doc = new PDFDocument({
      size: [612, 1008], // Legal
      margin: 40,
    });

    const nombreArchivo = `Pagare - ${numeroContrato}-${nombreCompleto.replace(/\s+/g, " -")}`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${nombreArchivo}.pdf"`
    );

    doc.pipe(res);

    // =====================================================
    // PÁGINA 1: CONTRATO DE PRÉSTAMO CUOTA FIJA
    // =====================================================
    const dibujarPaginaContrato = () => {
      // Marca de agua
      doc.save();
      doc.opacity(0.08);
      try {
        doc.image(logoPath, 180, 350, { width: 250 });
      } catch (e) {}
      doc.restore();

      // Logo
      try {
        doc.image(logoPath, 35, 25, { width: 70, height: 55 });
      } catch (e) {}

      // Título alineado a la derecha
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("CONTRATO PRESTAMO", 40, 30, {
          width: 530,
          align: "right",
        });
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("CUOTA FIJA", 40, 48, {
          width: 530,
          align: "right",
        });

      // Subtítulos (No. y fecha) debajo del título, alineados a la derecha
      doc
        .fontSize(9)
        .font("Helvetica")
        .text(`No. ${numeroContrato}`, 40, 68, {
          width: 530,
          align: "right",
        });
      doc
        .fontSize(9)
        .font("Helvetica")
        .text(`Panamá, ${dia} de ${mesNombre} de ${anio}`, 40, 80, {
          width: 530,
          align: "right",
        });

      let y = 105;
      doc.fontSize(8.5).font("Helvetica");

      const partes = `Entre los suscritos a saber, LIR TECNOLOGÍA A LA VANGUARDIA, S.A., sociedad anónima constituida conforme a las leyes de la República de Panamá, con RUC 155657158-2-2017, D.V. 56, con domicilio en ciudad de Panamá, corregimiento de Bella Vista, Vía España, Plaza Concordia, oficina 247, teléfono 211-3178, debidamente representada en este acto por ISRAEL RODRÍGUEZ WARREN, portador de la cédula de identidad personal No. 1-703-206, quien en adelante se denominará EL PRESTAMISTA; y, por la otra parte, ${nombreCompleto}, ${nacionalidad}, mayor de edad, portador(a) de la cédula de identidad personal No. ${cedula}, domiciliado(a) en ${direccionCompleta}, teléfono ${telefono}, quien en adelante se denominará EL PRESTATARIO; hemos convenido celebrar el presente CONTRATO DE PRÉSTAMO, sujeto a las siguientes cláusulas:`;

      doc.text(partes, 40, y, { width: 530, align: "justify", lineGap: 1.5 });
      y = doc.y + 12;

      const clausulas = [
        {
          titulo: "PRIMERA – OBJETO:",
          texto: `EL PRESTAMISTA entrega a EL PRESTATARIO, en calidad de préstamo, la suma de ${capitalLetras} (B/.${capitalStr}), quien declara haberla recibido a su entera satisfacción y se obliga a restituirla en los términos establecidos en este contrato.`,
        },
        {
          titulo: "SEGUNDA – MODALIDAD:",
          texto: `Las partes expresan que la modalidad de préstamo utilizada en este contrato será préstamo a cuotas fijas, la cual se caracterizará por el pago fijo de una cuota quincenal hasta terminar de cancelar la deuda.`,
        },
        {
          titulo: "TERCERA - CONDICIONES FINANCIERAS:",
          texto: `Capital prestado: B/.${capitalStr}; Tasa de interés (si aplica) ${tasaStr}% quincenal; Monto total de intereses B/.${montoInteresesStr}; otros cargos aplicables: N/A; Monto total de la obligación: B/.${montoTotalStr}; Número de cuotas: ${numCuotas} quincenales; Valor de cada cuota B/.${valorCuotaStr}. Fecha de inicio ${fechaInicioStr}; Fecha de vencimiento final: ${fechaVencimientoStr}; días de gracia: TRES (3).`,
        },
        {
          titulo: "CUARTA – MORA:",
          texto: `Cuando EL PRESTATARIO no realice el pago de una cuota dentro del término establecido, incluyendo el periodo de gracia pactado, incurrirá en mora. El interés o recargo moratorio será de QUINCE BALBOAS (B/.15.00), aplicado exclusivamente en la forma permitida por la legislación vigente.`,
        },
        {
          titulo: "QUINTA – FORMA DE PAGO:",
          texto: `Los pagos podrán realizarse mediante: depósito, transferencia bancaria, efectivo contra recibo; o cualquier otro mecanismo previamente autorizado por EL PRESTAMISTA. Todo pago deberá quedar debidamente documentado.`,
        },
        {
          titulo: "SEXTA – APLICACIÓN DE PAGOS:",
          texto: `Los pagos serán aplicados conforme a la legislación vigente y a las condiciones financieras expresamente pactadas, teniendo en cuenta que los primero serán abonados los saldos antiguos y morosidades adeudadas (a. Se abona a las morosidades adeudadas; b. luego a la cuota corriente; c. por último se abonaría el saldo pendiente al capital adeudado a la fecha). En todo caso, EL PRESTATARIO tendrá derecho a conocer el saldo actualizado de su obligación.`,
        },
        {
          titulo: "SÉPTIMA – PAGO ANTICIPADO:",
          texto: `EL PRESTATARIO podrá efectuar abonos extraordinarios o cancelar anticipadamente la obligación, sujeto a las disposiciones legales aplicables.`,
        },
        {
          titulo: "OCTAVA - VENCIMIENTO ANTICIPADO:",
          texto: `El incumplimiento de las obligaciones de pago facultará a EL PRESTAMISTA, cuando legalmente proceda, para declarar vencido anticipadamente el saldo de la obligación y exigir su pago.`,
        },
        {
          titulo: "NOVENA – PAGARÉ:",
          texto: `Para documentar y garantizar el cumplimiento de las obligaciones dinerarias asumidas mediante este contrato, EL PRESTATARIO suscribirá separadamente un PAGARÉ favor de EL PRESTAMISTA. El PAGARÉ no constituye una obligación adicional ni duplica la deuda, sino que documenta el saldo derivado del presente contrato. Todo pago realizado en virtud del contrato disminuirá correlativamente la obligación documentada mediante el pagaré.`,
        },
        {
          titulo: "DÉCIMA - GASTOS DE COBRO:",
          texto: `En caso de incumplimiento, EL PRESTATARIO responderá únicamente por aquellos gastos y costas de cobro que sean legalmente procedentes y efectivamente causados.`,
        },
        {
          titulo: "DÉCIMA PRIMERA – NOTIFICACIONES:",
          texto: `EL PRESTATARIO señala como dirección, teléfono y correo electrónico para recibir comunicaciones: Dirección: ${direccionCompleta}; Teléfono: ${telefono}; Correo electrónico: ${email}. Cualquier modificación deberá ser comunicada a EL PRESTAMISTA.`,
        },
        {
          titulo: "DÉCIMA SEGUNDA – LEGISLACIÓN:",
          texto: `El presente contrato se regirá por las leyes de la República de Panamá.`,
        },
      ];

      clausulas.forEach((c) => {
        doc.font("Helvetica-Bold").fontSize(8.5).text(c.titulo, 40, y, {
          continued: true,
        });
        doc.font("Helvetica").text(" " + c.texto, {
          width: 530,
          align: "justify",
          lineGap: 1,
        });
        y = doc.y + 8;
      });

      // Firmas
      y = doc.y + 20;
      if (y > 820) y = 820;

      doc
        .fontSize(9)
        .font("Helvetica")
        .text(
          `Firmado en la ciudad de Panamá, República de Panamá, a los ${dia} días del mes de ${mesNombre} de ${anio}.`,
          40,
          y,
          { width: 530 }
        );

      y = doc.y + 30;

      doc.moveTo(50, y + 25).lineTo(230, y + 25).stroke();
      doc.moveTo(340, y + 25).lineTo(530, y + 25).stroke();

      doc.fontSize(8).font("Helvetica");

      // Prestamista (izquierda) — alineado a la izquierda
      doc.text("EL PRESTAMISTA", 50, y + 32, { width: 180, align: "left" });
      doc.text("LIR TECNOLOGIA A LA VANGUARDIA, S.A.", 50, y + 45, {
        width: 180,
        align: "left",
      });
      doc.text("Israel Rodríguez Warren", 50, y + 58, {
        width: 180,
        align: "left",
      });
      doc.text("Cédula 1-703-206", 50, y + 71, {
        width: 180,
        align: "left",
      });

      // Prestatario (derecha) — solo líneas para llenar a mano
      doc.text("EL PRESTATARIO", 340, y + 32, { width: 190, align: "left" });
      doc.text("Nombre: ____________________________", 340, y + 63);
      doc.text("Cédula: ____________________________", 340, y + 78);
    };

    // =====================================================
    // PÁGINA 2: GUÍA DE AUTORIZACIÓN DEL CLIENTE
    // =====================================================
    const dibujarPaginaAutorizacion = () => {
      doc.addPage();

      doc.save();
      doc.opacity(0.08);
      try {
        doc.image(logoPath, 180, 350, { width: 250 });
      } catch (e) {}
      doc.restore();

      // Título centrado (único que se mantiene al centro)
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("GUIA DE AUTORIZACIÓN DEL CLIENTE", 1, 40, { align: "center" });
      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Persona Natural", 1, 58, { align: "center" });

      let y = 85;
      doc.fontSize(8.5).font("Helvetica");

      const intro = `El suscrito ${nombreCompleto}, portador de la cédula, pasaporte ${cedula}, por este medio autorizo expresamente a LIR TECNOLOGÍA A LA VANGUARDIA, S.A., y/o cualquier Agencia de Información de Datos sobre el Historial de Crédito de Consumidores y Clientes, para que de conformidad con lo expresado en la Ley 24 de 2002, capte, obtenga, solicite, recopile, registre, organice, estructure, almacene, conserve, adapte o modifique según lo que permita u ordene la ley, extraiga, consulte, utilice, comunique, transmita, intercambie, comparta, difunda (en aquellos casos en los que la ley lo permita u ordene), limite, suprima o destruya (en aquellos datos en los que la ley lo permita u ordene) y en cualquier otra forma trate mis datos, en los siguientes términos:`;

      doc.text(intro, 40, y, { width: 530, align: "justify", lineGap: 1.5 });
      y = doc.y + 12;

      doc
        .font("Helvetica-Bold")
        .text("1. ¿Qué tipo de datos serán objeto de tratamiento?", 40, y);
      y = doc.y + 3;
      doc
        .font("Helvetica")
        .text(
          "Datos asociados a transacciones económicas mercantiles, financieras o bancarias pagaderas en uno o varios plazos contenidos o que podrán ser registrados en mi historial crediticio, en los términos de la Ley 24 de 2002 y sus reformas.",
          40,
          y,
          { width: 530, align: "justify" }
        );
      y = doc.y + 10;

      doc
        .font("Helvetica-Bold")
        .text("2. ¿Cuáles son las finalidades del tratamiento?", 40, y);
      y = doc.y + 5;

      const finalidades = [
        "i. Consulte en la base de datos de una Agencia de Información de Datos sobre el Historial de Crédito de Consumidores y Clientes, según la Ley 24 de 2002, toda mi información relevante para conocer mi desempeño como deudor, y mi capacidad de pago ya sea para determinar la viabilidad para iniciar o mantener una relación contractual, o bien para dar seguimiento a la relación contractual previamente establecida o que se establezca, mientras que se mantenga la misma.",
        "ii. Reporte en la base de datos de una Agencia de Información de Datos sobre el Historial de Crédito de Consumidores y Clientes, según la Ley 24 de 2002, mi información sobre el cumplimiento o incumplimiento de las obligaciones asociadas con transacciones económicas o mercantiles pagaderas en uno o varios plazos, así como otra información atinente a mis relaciones comerciales y financieras que tenga con LIR TECNOLOGÍA A LA VANGUARDIA, S.A.",
        "iii. En virtud de la presente autorización, reconozco que el comportamiento frente a mis obligaciones y demás información pertinente para la evaluación del riesgo crediticio y prevención de fraude, serán registrados en la base de datos de la Agencia de Información de Datos sobre el Historial de Crédito de Consumidores y Clientes, con el objeto de suministrar información suficiente y adecuada al mercado, ya sea del sector real o financiero, sobre el estado de mis obligaciones financieras, comerciales, crediticias, de servicios y para que se adelanten actividades inherentes a la evaluación del riesgo crediticio y prevención del fraude, de blanqueo de capitales y financiación del terrorismo y demás que la legislación permita. Igualmente, reconozco y autorizo que los agentes económicos podrán tener acceso a conocer qué otros agentes económicos han consultado los datos sobre el historial de crédito almacenados en el sistema de APC BURÓ, S.A., de manera previa al perfeccionamiento de la relación de crédito/obligación dineraria pagadera a plazo y/o durante la vigencia de la misma.",
        "iv. Autorizo a APC BURÓ S.A., y a las otras compañías del grupo de la misma ubicadas en otros países, y a terceros mandatarios, a realizar un tratamiento transfronterizo de datos sobre mi historial de crédito, para que LIR TECNOLOGÍA A LA VANGUARDIA, S.A, o su grupo empresarial la utilice para adelantar las actividades identificadas en los numerales anteriores.",
        "v. Que APC BURÓ, S.A., como Agencia de Información de Datos sobre el Historial de Crédito de Consumidores y Clientes aplique los procedimientos científicos y objetivos necesarios a los datos contenidos en mi historial de crédito, a fin de proporcionar el score del buró con relación a mis referencias crediticias.",
      ];

      finalidades.forEach((f) => {
        doc
          .font("Helvetica")
          .fontSize(8)
          .text(f, 40, y, { width: 530, align: "justify", lineGap: 1 });
        y = doc.y + 6;
      });

      doc.fontSize(8.5).text(
        "El tratamiento de la información para estas finalidades se mantendrá en la base de datos de APC BURÓ, S.A. por el tiempo que la ley lo permita. Declaro que la anterior autorización se otorga de manera libre, informada y voluntaria. APC BURÓ, S.A. no utilizará los datos recopilados de acuerdo con este documento para fines distintos a los establecidos en este documento, ni para fines incompatibles con aquellos para los cuales los datos fueron recopilados.",
        40,
        y,
        { width: 530, align: "justify" }
      );
      y = doc.y + 10;

      doc
        .font("Helvetica-Bold")
        .text(
          "3. ¿Qué derechos le asisten como al titular de los datos e información proporcionada?",
          40,
          y
        );
      y = doc.y + 3;
      doc.font("Helvetica").text(
        "Se garantizan los derechos que tiene el titular de la información sobre los datos proporcionados a LIR TECNOLOGÍA A LA VANGUARDIA, S.A., a APC BURÓ, S.A. y/o algunas de las compañías del grupo, en los términos establecidos en este documento, en la Ley 24 de 2002 y sus reformas.",
        40,
        y,
        { width: 530, align: "justify" }
      );
      y = doc.y + 8;
      doc.text(
        "El suscrito conoce que estos derechos los podrá ejercer frente a LIR TECNOLOGIA A LA VANGUARDIA, S.A. o ante la Autoridad de Protección al Consumidor y Defensa de la Competencia (ACODECO).",
        40,
        y,
        { width: 530, align: "justify" }
      );
      y = doc.y + 20;

      doc.text(
        `Firmado en Panamá, a los ${dia} días del mes de ${mesNombre} del año ${anio}.`,
        40,
        y
      );
      y += 30;

      // Solo líneas en blanco
      doc.text("Nombre:  ___________________________________", 40, y);
      doc.text("Cédula:  ___________________________________", 40, y + 18);
      doc.text("Firma:   ___________________________________", 40, y + 36);
    };

    // =====================================================
    // PÁGINA 3: PAGARÉ A LA VISTA
    // =====================================================
    const dibujarPaginaPagare = () => {
      doc.addPage();

      doc.save();
      doc.opacity(0.08);
      try {
        doc.image(logoPath, 180, 350, { width: 250 });
      } catch (e) {}
      doc.restore();

      // Título alineado a la derecha
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("PAGARÉ A LA VISTA", 40, 40, {
          width: 530,
          align: "right",
        });

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Panamá, ${dia} de ${mesNombre} de ${anio}`, 40, 65, {
          width: 530,
          align: "right",
        });

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(`MONTO: B/.${montoTotalStr}`, 40, 82, {
          width: 530,
          align: "right",
        });

      let y = 120;
      doc.fontSize(9.5).font("Helvetica");

      const montoLetras = `${montoTotalLetras} CON 00/100`.toUpperCase();

      const pagareIntro = `Por medio del presente PAGARÉ A LA VISTA, yo, ${nombreCompleto}, mayor de edad, portador de la cédula de identidad personal No. ${cedula}, PROMETO PURA Y SIMPLEMENTE PAGAR A LA ORDEN DE LIR TECNOLOGIA A LA VANGUARDIA, S.A., sociedad con RUC 155657158-2-2017, D.V. 56, la suma de ${montoLetras} (B/.${montoTotalStr}).`;

      doc.text(pagareIntro, 40, y, {
        width: 530,
        align: "justify",
        lineGap: 2,
      });
      y = doc.y + 18;

      doc.text(
        `La suma indicada será pagada el día ${fechaUltimaLarga}, en las oficinas de LIR TECNOLOGIA A LA VANGUARDIA, S.A., Ubicada en vía España, Plaza Concordia, Oficina 247, corregimiento de Bella Vista, distrito y provincia de Panamá, República de Panamá.`,
        40,
        y,
        { width: 530, align: "justify", lineGap: 2 }
      );
      y = doc.y + 18;

      doc.text(
        `El presente pagaré se suscribe en la ciudad de Panamá, República de Panamá, el día ${dia} de ${mesNombre} del ${anio}.`,
        40,
        y,
        { width: 530 }
      );
      y = doc.y + 40;

      doc.font("Helvetica-Bold").text("EL SUSCRIPTOR / DEUDOR", 40, y);
      y += 35;

      // Solo líneas en blanco
      doc.font("Helvetica");
      doc.moveTo(40, y).lineTo(250, y).stroke();
      doc.text("Nombre: __________________________________", 40, y + 25);
      doc.text("Cédula:  __________________________________", 40, y + 42);
    };

    // Generar las 3 páginas (sin página en blanco)
    dibujarPaginaContrato();
    dibujarPaginaAutorizacion();
    dibujarPaginaPagare();

    doc.end();
  } catch (error) {
    console.error("Error generando contrato de préstamo cuota fija:", error);
    res.status(500).json({
      message: "Error generando el contrato en PDF",
      error: error.message,
    });
  }
};

module.exports = { generarContratoPrestamoCuotaFijaPDF };