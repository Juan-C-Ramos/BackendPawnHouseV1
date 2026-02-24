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

      // Lo calculado en FRONT
      montoMorosidad,
      montoInteres,
      montoITBMS,
      montoCapital,

      // Banderas
      liquidarContrato,
      forzarInteres,
    } = req.body;

    // 1) Obtener contrato actual
    const contrato = await ContratoEmpeno.findByPk(contratoEmpenoId, {
      transaction: t,
    });

    if (!contrato) {
      await t.rollback();
      return res.status(404).json({ message: "Contrato no encontrado" });
    }

    // ====== 🔥 GENERAR INTERÉS POR MESES ATRASADOS (BACKEND) ======
const hoy = new Date();
const ultima = contrato.ultimaFechaPagoInteres
  ? new Date(contrato.ultimaFechaPagoInteres)
  : new Date(contrato.fechaContrato);

let mesesAtrasados =
  (hoy.getFullYear() - ultima.getFullYear()) * 12 +
  (hoy.getMonth() - ultima.getMonth()) + 1;

mesesAtrasados = Math.max(0, mesesAtrasados);

const interesMensual = Number(contrato.interesMensualEfectivo || 0);
const interesGenerado = interesMensual * mesesAtrasados;

// 🔹 Sumamos el interés generado al saldo anterior
const interesAnteriorAjustado =
  Number(contrato.interesAdeudado) + interesGenerado;


    // ====== ANTES DEL PAGO (snapshot REAL) ======
const capitalAnterior = Number(contrato.capitalAdeudado);
const interesAnterior = interesAnteriorAjustado; // <-- IMPORTANTE
const morosidadAnterior = Number(contrato.morosidadAdeudada);

// ====== DESPUÉS DEL PAGO ======
const capitalNuevo = Math.max(
  0,
  capitalAnterior - Number(montoCapital)
);

const interesNuevo = Math.max(
  0,
  interesAnterior - Number(montoInteres)
);

const morosidadNuevo = Math.max(
  0,
  morosidadAnterior - Number(montoMorosidad)
);

const fechaLocal = new Date(
  hoy.getFullYear(),
  hoy.getMonth(),
  hoy.getDate()
);




    // ====== REGISTRAR PAGO ======
    const nuevoPago = await PagosEmpeños.create(
      
      {
        numeroPago: `TEMP`,
        fechaPago:fechaLocal,

        montoCapital: montoCapital,
        montoCapitalAnterior: capitalAnterior,
        montoCapitalNuevo: capitalNuevo,

        montoInteres: montoInteres,
        montoInteresAnterior: interesAnterior,
        montoInteresNuevo: interesNuevo,

        montoMorosidad: montoMorosidad,
        montoMorosidadAnterior: morosidadAnterior,
        montoMorosidadNuevo: morosidadNuevo,

        montoITBMS: montoITBMS,

        estatusPago: "COMPLETADO",
        metodoPago,

        montoTotalPago: montoTotalRecibido,

        contratoEmpenoId,
        customerId,
        userId,
      },
      { transaction: t }
    );

    // 🔥 GENERAR NÚMERO DE RECIBO CON EL ID REAL
const numeroReciboFinal = generarNumeroRecibo(nuevoPago.id);

// Actualizamos el pago con el número definitivo
await nuevoPago.update(
  { numeroPago: numeroReciboFinal },
  { transaction: t }
);


    contrato.totalPagadoCapital =
  Number(contrato.totalPagadoCapital) + Number(montoCapital);

contrato.totalPagadoInteres =
  Number(contrato.totalPagadoInteres) + Number(montoInteres);

contrato.totalPagadoMorosidad =
  Number(contrato.totalPagadoMorosidad) + Number(montoMorosidad);

// ⚠️ OJO: aquí guardamos el saldo YA con intereses generados
contrato.capitalAdeudado = capitalNuevo;
contrato.interesAdeudado = interesNuevo; 
contrato.morosidadAdeudada = morosidadNuevo;


// 🔹 SIEMPRE que haya pago de interés → actualizamos última fecha
if (Number(montoInteres) > 0) {
  contrato.ultimaFechaPagoInteres = new Date();
}

// 🔹 Manejo de fechas de corte (opcional pero recomendado)
contrato.anteriorFechaCorte = contrato.nuevaFechaCorte || null;
contrato.nuevaFechaCorte = new Date();



    // 🔹 Si se liquida y capital quedó en 0 → contrato PAGADO
    if (liquidarContrato && capitalNuevo === 0) {
      contrato.estatus = "PAGADO";
    }

    await contrato.save({ transaction: t });

    await t.commit();

    return res.status(201).json({
      message: "Pago registrado y contrato actualizado correctamente",
      pago: nuevoPago,
      contratoActualizado: contrato,
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.status(500).json({ message: "Error registrando el pago", error });
  }
};

exports.obtenerPagosPorContrato = async (req, res) => {
  try {
    const { contratoEmpenoId } = req.params;

    const pagos = await PagosEmpeños.findAll({
      where: { contratoEmpenoId },
      order: [["fechaPago", "DESC"]],
    });

    res.json(pagos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo pagos", error });
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


