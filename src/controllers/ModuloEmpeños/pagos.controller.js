const {
  
  ContratoEmpeno,
  Customer,
  User,
  Pagos
} = require('../../models');
const PagosEmpeños = require('../../models/ModuloEmpeños/Pagos');
const sequelize = require("../../utils/connection");

const generarNumeroRecibo = (id) => {
  const year = new Date().getFullYear();
  const paddedId = String(id).padStart(7, "0"); // 7 dígitos: 0000001, 0000012, etc.
  return `Recibo-${year}-${paddedId}`;
};


exports.registrarPagoEmpeno = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      contratoEmpenoId,
      customerId,
      userId,
      montoTotalRecibido,
      metodoPago,
      aplicaITBMS,
      descontarITBMS,
      liquidarContrato,
      forzarInteres,
      

      // preview del front (para validar)
      montoMorosidad: frontMorosidad,
      montoInteres: frontInteres,
      montoITBMS: frontITBMS,
      montoCapital: frontCapital,
    } = req.body;

    const contrato = await ContratoEmpeno.findByPk(contratoEmpenoId, {
      transaction: t,
    });
    

    if (!contrato) {
      await t.rollback();
      return res.status(404).json({ message: "Contrato no encontrado" });
    }

    if (contrato.estatus === "PAGADO") {
  await t.rollback();

  return res.status(400).json({
    message: "Este contrato ya está pagado. No se pueden registrar más pagos.",
  });
}

    const hoy = new Date();

    // ================================
    // 1️⃣ CALCULAR MESES (IGUAL QUE FRONT)
    // ================================
const capitalBase = Number(
  contrato.capitalAdeudado || 0
);

const tasa = Number(
  contrato.tasaInteres || 0
);

const morosidadAdeudada = Number(
  contrato.morosidadAdeudada || 0
);

const interesMensual =
  capitalBase * (tasa / 100);

const fechaInicio = new Date(
  contrato.anteriorFechaCorte
);

const fechaFin = new Date(
  contrato.nuevaFechaCorte
);

fechaFin.setHours(23, 59, 59, 999);

let interesAdeudadoCalculado = Number(
  contrato.interesAdeudado || 0
);

// ======================================
// CASO 1
// DENTRO DEL PERÍODO
// ======================================

const estaDentroDelPeriodo =
  hoy >= fechaInicio &&
  hoy <= fechaFin;

if (estaDentroDelPeriodo) {

  interesAdeudadoCalculado +=
    interesMensual;

}

// ======================================
// CASO 2
// PERÍODO VENCIDO
// ======================================

if (hoy > fechaFin) {

  let mesesAtrasados =
    (hoy.getFullYear() - fechaFin.getFullYear()) * 12 +
    (hoy.getMonth() - fechaFin.getMonth());

  if (hoy.getDate() > fechaFin.getDate()) {
    mesesAtrasados += 1;
  }

  if (mesesAtrasados < 1) {
    mesesAtrasados = 1;
  }

  interesAdeudadoCalculado +=
    interesMensual * mesesAtrasados;
}


// Forzar interés en liquidación
if (liquidarContrato) {
  interesAdeudadoCalculado = Math.max(
    interesAdeudadoCalculado,
    interesMensual
  );
}

// Forzar interés manual
if (forzarInteres) {
  interesAdeudadoCalculado = Math.max(
    interesAdeudadoCalculado,
    interesMensual
  );
}

    let saldo = Number(montoTotalRecibido);

    // ================================
    // 3️⃣ MOROSIDAD
    // ================================

    const pagoMorosidad = Math.min(saldo, morosidadAdeudada);
    saldo = Number(saldo.toFixed(2));
    saldo -= pagoMorosidad;
    saldo = Number(saldo.toFixed(2));

    // ================================
    // 4️⃣ INTERÉS (MISMA LÓGICA EXACTA)
    // ================================

    let pagoInteres = 0;
    let itbms = 0;
    let pagoInteresBruto = 0;

    if (aplicaITBMS && descontarITBMS) {

  const interesNetoPosible =
    Number((saldo / 1.07).toFixed(2));

  pagoInteres = Math.min(
    interesNetoPosible,
    interesAdeudadoCalculado
  );

  pagoInteres =
    Number(pagoInteres.toFixed(2));

  pagoInteresBruto =
    Number((pagoInteres * 1.07).toFixed(2));

  itbms =
    Number((pagoInteresBruto - pagoInteres).toFixed(2));

  saldo -= pagoInteresBruto;

  saldo =
    Number(saldo.toFixed(2));
}
    else {
      pagoInteresBruto = Math.min(
        saldo,
        interesAdeudadoCalculado
      );

      pagoInteres = pagoInteresBruto;

      if (aplicaITBMS) {
        itbms = pagoInteres * 0.07;
        itbms = Number(itbms.toFixed(2));
      }

pagoInteresBruto = Number(pagoInteresBruto.toFixed(2));
saldo -= pagoInteresBruto;
saldo = Number(saldo.toFixed(2));
}

    // ================================
    // 5️⃣ CAPITAL
    // ================================
    saldo = Number(saldo.toFixed(2));

    const pagoCapital = Math.min(
      saldo,
      Number(contrato.capitalAdeudado || 0)
    );

    // ================================
    // 6️⃣ VALIDAR CONTRA FRONT
    // ================================

    const tolerance = 0.01;

    const coincide =
      Math.abs(pagoMorosidad - Number(frontMorosidad)) < tolerance &&
      Math.abs(pagoInteres - Number(frontInteres)) < tolerance &&
      Math.abs(itbms - Number(frontITBMS)) < tolerance &&
      Math.abs(pagoCapital - Number(frontCapital)) < tolerance;

    console.log("Backend:", {
      pagoMorosidad,
      pagoInteres,
      itbms,
      pagoCapital,
    });

    console.log("Front:", {
      frontMorosidad,
      frontInteres,
      frontITBMS,
      frontCapital,
    });

    if (!coincide) {
      await t.rollback();
      return res.status(400).json({
        message: "Los cálculos no coinciden",
        backend: {
          pagoMorosidad,
          pagoInteres,
          itbms,
          pagoCapital,
        },
      });
    }

    // ================================
    // 7️⃣ NUEVOS SALDOS
    // ================================

    const capitalNuevo = Math.max(
      0,
      Number(contrato.capitalAdeudado) - pagoCapital
    );

    const interesNuevo = Math.max(
      0,
      interesAdeudadoCalculado - pagoInteres
    );

    const morosidadNuevo = Math.max(
      0,
      morosidadAdeudada - pagoMorosidad
    );

    // ================================
    // 8️⃣ CREAR PAGO
    // ================================

    const nuevoPago = await PagosEmpeños.create(
      {
        numeroPago: "TEMP",
        fechaPago: hoy,

        montoCapital: pagoCapital,
        montoCapitalAnterior: contrato.capitalAdeudado,
        montoCapitalNuevo: capitalNuevo,

        montoInteres: pagoInteres,
        montoInteresAnterior: interesAdeudadoCalculado,
        montoInteresNuevo: interesNuevo,

        montoMorosidad: pagoMorosidad,
        montoMorosidadAnterior: morosidadAdeudada,
        montoMorosidadNuevo: morosidadNuevo,

        montoITBMS: itbms,
        montoTotalPago: montoTotalRecibido,
        metodoPago,
        estatusPago: "COMPLETADO",

        contratoEmpenoId,
        customerId,
        userId,
      },
      { transaction: t }
    );
    // generar numero real
const numeroRecibo = generarNumeroRecibo(nuevoPago.id);

await nuevoPago.update(
{
  numeroPago: numeroRecibo
},
{ transaction: t }
);

    // ================================
    // 9️⃣ ACTUALIZAR CONTRATO
    // ================================

    contrato.capitalAdeudado = capitalNuevo;
    contrato.interesAdeudado = interesNuevo;
    contrato.morosidadAdeudada = morosidadNuevo;

    contrato.totalPagadoCapital =
  Number(
    Number(contrato.totalPagadoCapital || 0) + Number(pagoCapital)
  ).toFixed(2);

contrato.totalPagadoInteres =
  Number(
    Number(contrato.totalPagadoInteres || 0) + Number(pagoInteres)
  ).toFixed(2);

contrato.totalPagadoMorosidad =
  Number(
    Number(contrato.totalPagadoMorosidad || 0) + Number(pagoMorosidad)
  ).toFixed(2);

    if (pagoInteres) {
  contrato.ultimaFechaPagoInteres = hoy;

  // Guardar anterior
  contrato.anteriorFechaCorte =
  contrato.nuevaFechaCorte ||
  contrato.fechaContrato;

  const fechaContrato = new Date(contrato.fechaContrato);
  const diaOriginal = fechaContrato.getDate();

  // Base: hoy + 1 mes
  const nuevaFecha = new Date(hoy);
  nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);

  // Ajustar al día original
  const ultimoDiaDelMes = new Date(
    nuevaFecha.getFullYear(),
    nuevaFecha.getMonth() + 1,
    0
  ).getDate();

  nuevaFecha.setDate(Math.min(diaOriginal, ultimoDiaDelMes));

  contrato.nuevaFechaCorte = nuevaFecha;
}

    // ================================
// CERRAR CONTRATO SI CAPITAL ES 0
// ================================

if (capitalNuevo === 0) {
  contrato.estatus = "PAGADO";
}

    await contrato.save({ transaction: t });

    await t.commit();

    return res.status(201).json({
      message: "Pago registrado correctamente",
      pago: nuevoPago,
      contratoActualizado: contrato,
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.status(500).json({
      message: "Error registrando pago",
      error,
    });
  }
};


exports.listarPagosPorContrato = async (req, res) => {
  try {
    const { contratoEmpenoId } = req.params;

    const pagos = await PagosEmpeños.findAll({
      where: { contratoEmpenoId },
      order: [["fechaPago", "DESC"]],
      include: [
        { model: User, attributes: ["id", "firstName", "lastName"] }
      ]
    });

    return res.json(pagos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error al listar pagos"
    });
  }
};


exports.obtenerPagosPorContrato = async (req, res) => {
  try {
    const { contratoId } = req.params;

    const pagos = await Pagos.findAll({
      where: {
        contratoEmpenoId: contratoId,
      },
      order: [["fechaPago", "DESC"]],
    });

    return res.status(200).json(pagos);
  } catch (error) {
    console.error("Error obteniendo pagos:", error);
    return res.status(500).json({
      message: "Error al obtener pagos",
      error: error.message,
    });
  }
};


exports.updatePagoEmpeno = async (req, res) => {

  const t = await sequelize.transaction();

  try {

    const { id } = req.params;
    const data = req.body;

    const pagoDb = await PagosEmpeños.findByPk(id, {
      transaction: t
    });

    if (!pagoDb) {

      await t.rollback();

      return res.status(404).json({
        message: "Pago no encontrado"
      });

    }

    // helper anti ""
    const toNumberOrNull = (value) => {
      if (value === "" || value === undefined) return null;
      return value === null ? null : Number(value);
    };

    await pagoDb.update({

      numeroPago: data.numeroPago,
      fechaPago: data.fechaPago,

      montoCapital: toNumberOrNull(data.montoCapital),
      montoCapitalNuevo: toNumberOrNull(data.montoCapitalNuevo),
      montoCapitalAnterior: toNumberOrNull(data.montoCapitalAnterior),

      montoInteres: toNumberOrNull(data.montoInteres),
      montoInteresNuevo: toNumberOrNull(data.montoInteresNuevo),
      montoInteresAnterior: toNumberOrNull(data.montoInteresAnterior),

      montoMorosidad: toNumberOrNull(data.montoMorosidad),
      montoMorosidadNuevo: toNumberOrNull(data.montoMorosidadNuevo),
      montoMorosidadAnterior: toNumberOrNull(data.montoMorosidadAnterior),

      montoITBMS: toNumberOrNull(data.montoITBMS),

      metodoPago: data.metodoPago,
      estatusPago: data.estatusPago,

      montoTotalPago: toNumberOrNull(data.montoTotalPago)

    }, {
      transaction: t
    });

    await t.commit();

    res.json(pagoDb);

  }
  catch (error) {

    await t.rollback();

    console.error(error);

    res.status(500).json({
      message: "Error actualizando pago",
      error: error.message
    });

  }

};


