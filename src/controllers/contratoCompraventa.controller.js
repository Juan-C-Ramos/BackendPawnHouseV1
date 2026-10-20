// controllers/contratoCompraventaFinanciamiento.controller.js
const PDFDocument = require("pdfkit");
const path = require("path");
const {
  Transaction,
  Customer,
  VentasCredito,
  ProductosVentaCredito,
  Cuotes,
} = require("../models"); // Ajusta la ruta según tu estructura de models

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
const generarContratoCompraventaFinanciamientoPDF = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "El id de la transacción es requerido" });
    }

    const transaction = await Transaction.findByPk(id, {
      include: [
        {
          model: Customer,
        },
        {
          model: VentasCredito,
          as: "ventaCredito",
          include: [
            {
              model: ProductosVentaCredito,
              as: "productos",
            },
          ],
        },
        {
          model: Cuotes,
          as: "transactionCuotes",
        },
      ],
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transacción no encontrada" });
    }

    if (transaction.transactionType !== "venta") {
      return res.status(400).json({
        message: `Esta transacción es de tipo "${transaction.transactionType}". Este contrato solo aplica a ventas a crédito.`,
      });
    }

    const cliente = transaction.Customer || transaction.customer;
    const ventaCredito = transaction.ventaCredito;
    const cuotas = transaction.transactionCuotes || [];

    if (!cliente) {
      return res.status(400).json({ message: "La transacción no tiene cliente asociado" });
    }
    if (!ventaCredito) {
      return res.status(400).json({
        message: "No se encontró el registro de VentasCredito para esta transacción",
      });
    }

    // ---------- MAPEAR DATOS ----------
    const nombreCompleto = `${cliente.firstName || ""} ${cliente.lastName || ""}`.trim();
    const cedula = cliente.numberID || "__________";
    const telefono = cliente.phone || "_________________________";
    const email = cliente.email || "_______________________________";

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
        .join(", ") || "_______________________________________";

    const numeroContrato =
      ventaCredito.ventaCreditoNumero ||
      transaction.contractNumber ||
      `VC-${transaction.id}`;
    const facturaNo = ventaCredito.facturaNumero || "________";

    const fechaContrato = transaction.startDate
      ? new Date(transaction.startDate)
      : new Date();
    const dia = fechaContrato.getDate();
    const mesNombre = MESES[fechaContrato.getMonth()];
    const anio = fechaContrato.getFullYear();

    const precioVenta = toFixed2(ventaCredito.precioContadoTotal);
    const montoFinanciado = toFixed2(ventaCredito.montoFinanciado);
    const montoTotal = toFixed2(
      ventaCredito.financiamientoTotal || ventaCredito.precioContadoTotal
    );
    const abonoInicial = toFixed2(ventaCredito.abonoInicial);
    const otrosCargos = toFixed2(transaction.interestAmount || 0);
    const montoAFinanciar = toFixed2(ventaCredito.montoFinanciado);

    const numCuotas = transaction.cuotes || cuotas.length || "_____";
    const montoCuotaNum =
      transaction.cuotesAmount || (cuotas[0] ? cuotas[0].amount : 0);
    const montoCuota = toFixed2(montoCuotaNum);
    const montoCuotaLetras = `${numeroALetras(montoCuotaNum)} BALBOAS`;

    let fechaPrimera = "_______________";
    let fechaUltima = "_______________";
    let fechaUltimaLarga =
      "“AQUÍ DEBE IR LA FECHA DEL ÚLTIMO PAGO CALCULADO POR EL SISTEMA”";

    if (cuotas.length > 0) {
      const cuotasOrdenadas = [...cuotas].sort(
        (a, b) => new Date(a.paymentCutDate) - new Date(b.paymentCutDate)
      );
      fechaPrimera = formatearFechaCorta(cuotasOrdenadas[0].paymentCutDate);
      fechaUltima = formatearFechaCorta(
        cuotasOrdenadas[cuotasOrdenadas.length - 1].paymentCutDate
      );
      fechaUltimaLarga = formatearFechaLarga(
        cuotasOrdenadas[cuotasOrdenadas.length - 1].paymentCutDate
      );
    } else {
      if (transaction.nextPaymentDate) {
        fechaPrimera = formatearFechaCorta(transaction.nextPaymentDate);
      }
      if (transaction.endDate) {
        fechaUltima = formatearFechaCorta(transaction.endDate);
        fechaUltimaLarga = formatearFechaLarga(transaction.endDate);
      }
    }

    // ---------- GENERAR PDF ----------
    const logoPath = path.join(__dirname, "../../logoVFinal.png");

    const doc = new PDFDocument({
      size: "LETTER",
      margin: 35,
    });

    const nombreArchivo = `Pagare - ${numeroContrato}-${nombreCompleto.replace(/\s+/g, " -")}`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${nombreArchivo}.pdf"`
    );

    doc.pipe(res);

    // ========== PÁGINA 1: CONTRATO ==========
    const dibujarPaginaContrato = () => {
      // Marca de agua
      doc.save();
      doc.opacity(0.08);
      try {
        doc.image(logoPath, 180, 250, { width: 250 });
      } catch (e) {}
      doc.restore();

      // Logo
      try {
        doc.image(logoPath, 30, 18, { width: 65, height: 50 });
      } catch (e) {}

      // Título alineado a la derecha
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("CONTRATO DE COMPRAVENTA", 30, 22, {
          width: 545,
          align: "right",
        });
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("CON FINANCIAMIENTO", 30, 37, {
          width: 545,
          align: "right",
        });

      // Subtítulos (No. y fecha) debajo del título, alineados a la derecha (sin cuadro)
      doc
        .fontSize(9)
        .font("Helvetica")
        .text(`No. ${numeroContrato}`, 30, 54, {
          width: 545,
          align: "right",
        });
      doc
        .fontSize(9)
        .font("Helvetica")
        .text(`Panamá, ${dia} de ${mesNombre} de ${anio}`, 30, 66, {
          width: 545,
          align: "right",
        });

      // Partes
      let y = 90;
      doc.fontSize(7.5).font("Helvetica");
      const partesTexto = `Entre LIR TECNOLOGÍA A LA VANGUARDIA, S.A., con RUC 155657158-2-2017, D.V. 56, domiciliada en ciudad de Panamá, Bella Vista, Vía España, Plaza Concordia, oficina 247, representada por ISRAEL RODRÍGUEZ WARREN, con cédula de identidad personal No. 1-703-206, denominada en adelante EL VENDEDOR; y por la otra, ${nombreCompleto} con cédula de Identidad Personal No. ${cedula}, dirección ${direccionCompleta}, teléfono ${telefono}, en adelante EL COMPRADOR.`;
      doc.text(partesTexto, 30, y, {
        width: 550,
        align: "justify",
        lineGap: 1,
      });
      y = doc.y + 7;

      // Cláusulas
      const clausulas = [
        {
          titulo: "CLAUSULA PRIMERA - OBJETO:",
          texto: `EL VENDEDOR vende a crédito a EL COMPRADOR el bien descrito en la factura No. ${facturaNo} adjunta en el anexo.`,
        },
        {
          titulo: "CLAUSULA SEGUNDA – PRECIO:",
          texto: `Las condiciones económicas son: Precio de venta B/.${precioVenta}; Monto financiado B/.${montoFinanciado}; Monto total B/.${montoTotal}; Otros cargos B/.${otrosCargos}; Abono inicial (si aplica) B/.${abonoInicial}; Monto total a financiar B/.${montoAFinanciar}.`,
        },
        {
          titulo: "CLAUSULA TERCERA – CUOTAS:",
          texto: `EL COMPRADOR pagará el saldo mediante ${numCuotas} cuotas quincenales de B/.${montoCuota} (${montoCuotaLetras}) cada una, siendo su primera cuota el día ${fechaPrimera}, y la última el día ${fechaUltima} (se incorpora como “Anexo A” el calendario completo de pagos).`,
        },
        {
          titulo: "CLAUSULA CUARTA – ENTREGA:",
          texto: `EL COMPRADOR declara haber recibido el bien descrito en este documento según las condiciones descritas en la factura de compraventa No. ${facturaNo}. La entrega se acreditará mediante la correspondiente constancia de recepción.`,
        },
        {
          titulo: "CLAUSULA QUINTA – FORMA DE PAGO:",
          texto: `EL COMPRADOR efectuará los pagos mediante depósito, transferencia o efectivo, contra recibo o cualquier mecanismo autorizado por EL VENDEDOR.`,
        },
        {
          titulo: "CLAUSULA SEXTA – MORA:",
          texto: `El incumplimiento del pago de una cuota por parte de EL COMPRADOR, generará únicamente los intereses o recargos moratorios expresamente pactados y legalmente permitidos. Periodo de gracia TRES (3) días; Tasa/recargo aplicable de QUINCE BALBOAS (B/.15.00) sobre la cuota vencida.`,
        },
        {
          titulo: "CLAUSULA SEPTIMA – VENCIMIENTO ANTICIPADO:",
          texto: `Ante el incumplimiento que legalmente permita declarar vencida anticipadamente la obligación, EL VENDEDOR podrá exigir el saldo pendiente conforme a este contrato y la legislación aplicable.`,
        },
        {
          titulo: "CLAUSULA OCTAVA – PAGARE:",
          texto: `Para documentar y garantizar el saldo financiado derivado de esta compraventa, EL COMPRADOR suscribirá simultáneamente un PAGARÉ independiente a favor de EL VENDEDOR. El PAGARÉ y este contrato documentan una misma obligación económica, por lo que no podrán ser utilizados para producir doble cobro. Cada pago efectuado por EL COMPRADOR, reducirá correlativamente el saldo documentado en ambos instrumentos.`,
        },
        {
          titulo: "CLAUSULA NOVENA – GARANTÍA DEL BIEN:",
          texto: `EL VENDEDOR responderá por las garantías correspondientes conforme a la naturaleza del bien y las disposiciones legales aplicables. El producto objeto de esta venta se encuentra libre de defectos de fabricación y materiales por un período de SESENTA (60) días calendario, contado a partir de la fecha de entrega al comprador. Durante este tiempo, la responsabilidad de EL VENDEDOR se limita exclusivamente a la reparación gratuita o al reemplazo del producto defectuoso, según sea el caso. Esta garantía no cubre daños causados por mal uso, accidentes, modificaciones no autorizadas o desgaste normal del producto.`,
        },
        {
          titulo: "CLAUSULA DECIMA – GASTOS DE COBRO:",
          texto: `En caso de incumplimiento EL COMPRADOR responderá por los gastos y costas que resulten legalmente procedentes y efectivamente causados.`,
        },
        {
          titulo: "CLAUSULA DECIMA PRIMERA – DOMICILIO:",
          texto: `Para efectos de comunicaciones y notificaciones EL COMPRADOR declara: Dirección ${direccionCompleta}, teléfono ${telefono} correo ${email}`,
        },
        {
          titulo: "CLAUSULA DECIMA SEGUNDA - LEGISLACION:",
          texto: `El presente contrato se regirá por las leyes de la República de Panamá.`,
        },
      ];

      clausulas.forEach((c) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(7.5)
          .text(c.titulo, 30, y, { continued: true });
        doc.font("Helvetica").text(" " + c.texto, {
          width: 550,
          align: "justify",
          lineGap: 0.5,
        });
        y = doc.y + 3.5;
      });

      // Firmas
      y = doc.y + 16;
      if (y > 680) y = 680;

      doc
        .fontSize(8)
        .font("Helvetica")
        .text(
          `Firmado en Panamá a los ${dia} días del mes de ${mesNombre} de ${anio}.`,
          30,
          y,
          { width: 550 }
        );

      y = doc.y + 25;

      // Líneas de firma
      doc.moveTo(40, y + 22).lineTo(200, y + 22).stroke();
      doc.moveTo(350, y + 22).lineTo(530, y + 22).stroke();

      doc.fontSize(7).font("Helvetica");

      // Vendedor (izquierda) — alineado a la izquierda
      doc.text("EL VENDEDOR", 40, y + 28, { width: 160, align: "left" });
      doc.text("LIR TECNOLOGIA A LA VANGUARDIA, S.A.", 40, y + 40, {
        width: 160,
        align: "left",
      });
      doc.text("Israel Rodríguez Warren", 40, y + 52, {
        width: 160,
        align: "left",
      });
      doc.text("Cédula 1-703-206", 40, y + 64, {
        width: 160,
        align: "left",
      });

      // Comprador (derecha) — solo líneas para llenar a mano
      doc.text("EL COMPRADOR", 350, y + 28, { width: 180, align: "left" });
      doc.text("Nombre: ____________________________", 350, y + 56);
      doc.text("Cédula: ____________________________", 350, y + 68);
    };

    // ========== PÁGINA 2: AUTORIZACIÓN ==========
    const dibujarPaginaAutorizacion = () => {
      doc.addPage();

      doc.save();
      doc.opacity(0.08);
      try {
        doc.image(logoPath, 180, 250, { width: 250 });
      } catch (e) {}
      doc.restore();

      // Título centrado (único que se mantiene al centro)
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("GUIA DE AUTORIZACIÓN DEL CLIENTE", 1, 35, { align: "center" });
      doc
        .fontSize(9)
        .font("Helvetica")
        .text("Persona Natural", 1, 50, { align: "center" });

      let y = 72;
      doc.fontSize(7.8).font("Helvetica");

      const intro = `El suscrito ${nombreCompleto}, portador de la cédula, pasaporte ${cedula}, por este medio autorizo expresamente a LIR TECNOLOGÍA A LA VANGUARDIA, S.A., y/o cualquier Agencia de Información de Datos sobre el Historial de Crédito de Consumidores y Clientes, para que de conformidad con lo expresado en la Ley 24 de 2002, capte, obtenga, solicite, recopile, registre, organice, estructure, almacene, conserve, adapte o modifique según lo que permita u ordene la ley, extraiga, consulte, utilice, comunique, transmita, intercambie, comparta, difunda (en aquellos casos en los que la ley lo permita u ordene), limite, suprima o destruya (en aquellos datos en los que la ley lo permita u ordene) y en cualquier otra forma trate mis datos, en los siguientes términos:`;
      doc.text(intro, 30, y, { width: 550, align: "justify", lineGap: 1.2 });
      y = doc.y + 8;

      doc
        .font("Helvetica-Bold")
        .text("1. ¿Qué tipo de datos serán objeto de tratamiento?", 30, y);
      y = doc.y + 2;
      doc.font("Helvetica").text(
        "Datos asociados a transacciones económicas mercantiles, financieras o bancarias pagaderas en uno o varios plazos contenidos o que podrán ser registrados en mi historial crediticio, en los términos de la Ley 24 de 2002 y sus reformas.",
        30,
        y,
        { width: 550, align: "justify" }
      );
      y = doc.y + 6;

      doc
        .font("Helvetica-Bold")
        .text("2. ¿Cuáles son las finalidades del tratamiento?", 30, y);
      y = doc.y + 3;

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
          .fontSize(7.3)
          .text(f, 30, y, { width: 550, align: "justify", lineGap: 0.8 });
        y = doc.y + 4;
      });

      doc.fontSize(7.8).text(
        "El tratamiento de la información para estas finalidades se mantendrá en la base de datos de APC BURÓ, S.A. por el tiempo que la ley lo permita. Declaro que la anterior autorización se otorga de manera libre, informada y voluntaria. APC BURÓ, S.A. no utilizará los datos recopilados de acuerdo con este documento para fines distintos a los establecidos en este documento, ni para fines incompatibles con aquellos para los cuales los datos fueron recopilados.",
        30,
        y,
        { width: 550, align: "justify" }
      );
      y = doc.y + 6;

      doc
        .font("Helvetica-Bold")
        .text(
          "3. ¿Qué derechos le asisten como al titular de los datos e información proporcionada?",
          30,
          y
        );
      y = doc.y + 2;
      doc.font("Helvetica").text(
        "Se garantizan los derechos que tiene el titular de la información sobre los datos proporcionados a LIR TECNOLOGÍA A LA VANGUARDIA, S.A., a APC BURÓ, S.A. y/o algunas de las compañías del grupo, en los términos establecidos en este documento, en la Ley 24 de 2002 y sus reformas.",
        30,
        y,
        { width: 550, align: "justify" }
      );
      y = doc.y + 5;
      doc.text(
        "El suscrito conoce que estos derechos los podrá ejercer frente a LIR TECNOLOGIA A LA VANGUARDIA, S.A. o ante la Autoridad de Protección al Consumidor y Defensa de la Competencia (ACODECO).",
        30,
        y,
        { width: 550, align: "justify" }
      );
      y = doc.y + 12;

      doc.text(
        `Firmado en Panamá, a los ${dia} días del mes de ${mesNombre} del año ${anio}.`,
        30,
        y
      );
      y += 25;

      // Firmas comprador: solo líneas en blanco
      doc.text("Nombre:  ___________________________________", 30, y);
      doc.text("Cédula:  ___________________________________", 30, y + 16);
      doc.text("Firma:   ___________________________________", 30, y + 32);
    };

    // ========== PÁGINA 3: PAGARÉ ==========
    const dibujarPaginaPagare = () => {
      doc.addPage();

      doc.save();
      doc.opacity(0.08);
      try {
        doc.image(logoPath, 180, 250, { width: 250 });
      } catch (e) {}
      doc.restore();

      // Título alineado a la derecha
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("PAGARÉ A LA ORDEN", 30, 45, {
          width: 545,
          align: "right",
        });

      doc.fontSize(10).font("Helvetica");
      doc.text(`Panamá, ${dia} de ${mesNombre} de ${anio}`, 30, 70, {
        width: 545,
        align: "right",
      });

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(`MONTO: B/.${montoAFinanciar}`, 30, 88, {
          width: 545,
          align: "right",
        });

      let y = 130;
      doc.font("Helvetica").fontSize(10);

      const montoLetras =
        `${numeroALetras(Number(montoAFinanciar))} BALBOAS CON 00/100`.toUpperCase();

      const pagareTexto = `Por medio del presente PAGARÉ A LA VISTA, yo, ${nombreCompleto}, mayor de edad, portador de la cédula de identidad personal No. ${cedula}, PROMETO PURA Y SIMPLEMENTE PAGAR A LA ORDEN DE LIR TECNOLOGIA A LA VANGUARDIA, S.A., sociedad con RUC 155657158-2-2017, D.V. 56, la suma de: ${montoLetras} (B/.${montoAFinanciar}).`;

      doc.text(pagareTexto, 40, y, {
        width: 520,
        align: "justify",
        lineGap: 3,
      });
      y = doc.y + 18;

      doc.text(
        `La suma indicada será pagada el día ${fechaUltimaLarga}, en las oficinas de LIR TECNOLOGIA A LA VANGUARDIA, S.A., Ubicada en vía España, Plaza Concordia, Oficina 247, corregimiento de Bella Vista, distrito y provincia de Panamá, República de Panamá.`,
        40,
        y,
        { width: 520, align: "justify", lineGap: 3 }
      );
      y = doc.y + 22;

      doc.text(
        `El presente pagaré se suscribe en la ciudad de Panamá, República de Panamá, el día ${dia} de ${mesNombre} del ${anio}.`,
        40,
        y,
        { width: 520 }
      );
      y += 45;

      doc.font("Helvetica-Bold").text("EL SUSCRIPTOR / DEUDOR", 40, y);
      y += 35;

      // Firmas: solo líneas en blanco
      doc.font("Helvetica");
      doc.moveTo(40, y).lineTo(250, y).stroke();
      doc.text("Nombre: __________________________________", 40, y + 25);
      doc.text("Cédula:  __________________________________", 40, y + 42);
    };

    // Generar las 3 páginas
    dibujarPaginaContrato();
    dibujarPaginaAutorizacion();
    dibujarPaginaPagare();

    doc.end();
  } catch (error) {
    console.error(
      "Error generando contrato de compraventa con financiamiento:",
      error
    );
    res.status(500).json({
      message: "Error generando el contrato en PDF",
      error: error.message,
    });
  }
};

module.exports = { generarContratoCompraventaFinanciamientoPDF };