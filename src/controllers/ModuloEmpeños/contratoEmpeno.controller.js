const { Op } = require("sequelize");
const {
  ContratoEmpeno,
  PrendaEmpeno,
  Customer,
  User,
} = require("../../models");
const sequelize = require("../../utils/connection");

// const generarNumeroContratoEmpeno = require("../../utils/generarNumeroContratoEmpeno");
const PagosEmpeños = require("../../models/ModuloEmpeños/Pagos");

function sumarUnMesMismoDia(fechaISO) {
  const fecha = new Date(fechaISO);
  const dia = fecha.getDate();

  // Ir al primer día del mes siguiente
  const nuevaFecha = new Date(fecha);
  nuevaFecha.setMonth(nuevaFecha.getMonth() + 1, 1);

  // Último día del mes siguiente
  const ultimoDiaMes = new Date(
    nuevaFecha.getFullYear(),
    nuevaFecha.getMonth() + 1,
    0
  ).getDate();

  // Usar el mismo día si existe, si no el último del mes
  nuevaFecha.setDate(Math.min(dia, ultimoDiaMes));

  return nuevaFecha.toISOString().split("T")[0];
}

function generarNumeroContratoEmpeno(numero) {
  return String(numero).padStart(8, "0");
}



exports.crearContratoEmpeno = async (req, res) => {
  const t = await sequelize.transaction();
  const contratosTotal = await ContratoEmpeno.findAll({
    transaction: t,
  });
  const nuevoNumero = generarNumeroContratoEmpeno(contratosTotal.length + 1);
  
  
  try {
    const { contrato, prendas } = req.body;

    // 1) Generar número de contrato (provisional)
    const fecha = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const numeroContrato = `EMP-${fecha}- ${nuevoNumero}`;
    console.log(contrato);

    const fechaBase = contrato.fechaContrato || new Date().toISOString().split("T")[0];

const anteriorFechaCorte = fechaBase;
const nuevaFechaCorte = sumarUnMesMismoDia(fechaBase);
const ultimaFechaPagoInteres = fechaBase;


    // 2) Crear contrato
    const nuevoContrato = await ContratoEmpeno.create(
      {
        ...contrato,
        numeroContrato,
        capitalTotal: contrato.montoPrestamo,
        capitalAdeudado: contrato.montoPrestamo,
        interesAdeudado: 0,
        totalPagadoCapital: 0,
        totalPagadoInteres: 0,
        totalPagadoMorosidad: 0,
        morosidadAdeudada: 0,
        morosidadTotal: 0,
        anteriorFechaCorte,
        nuevaFechaCorte,
        ultimaFechaPagoInteres,
      },
      { transaction: t },
    );

    // 3) Crear prendas asociadas
    const prendasConContrato = prendas.map((p) => ({
      ...p,
      kilateje: p.kilateje === "" ? null : Number(p.kilateje),
      pesoGramos: p.pesoGramos === "" ? null : Number(p.pesoGramos),
      valorEstimado: p.valorEstimado === "" ? 0 : Number(p.valorEstimado),
      facturaOriginalNumero:
        p.facturaOriginalNumero === "" ? null : p.facturaOriginalNumero,

      contratoEmpenoId: nuevoContrato.id,
      userId: contrato.userId,
      customerId: contrato.customerId,
    }));

    await PrendaEmpeno.bulkCreate(prendasConContrato, { transaction: t });

    await t.commit();

    return res.status(201).json({
      message: "Contrato creado correctamente",
      contrato: nuevoContrato,
      prendas: prendasConContrato,
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.status(500).json({
      message: "Error creando contrato",
      error: error.message,
    });
  }
};

exports.getContratoEmpenoById = async (req, res) => {
  try {
    const { id } = req.params;

    const contrato = await ContratoEmpeno.findByPk(id, {
      include: [Customer, User, PrendaEmpeno, PagosEmpeños],
    });

    if (!contrato) {
      return res.status(404).json({ message: "Contrato no encontrado" });
    }

    res.json(contrato);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener contrato" });
  }
};

exports.getContratosEmpeno = async (req, res) => {
  try {
    const { userId, customerId } = req.query;

    const where = {};

    if (userId) where.userId = userId;
    if (customerId) where.customerId = customerId;

    const contratos = await ContratoEmpeno.findAll({
      where,
      order: [["fechaContrato", "DESC"]],
      include: [
        {
          model: Customer,
        },
        {
          model: User,
        },
        {
          model: PrendaEmpeno,
        },
      ],
    });

    res.json(contratos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener contratos de empeño" });
  }
};

exports.getProximosAVencer = async (req, res) => {
  try {
    const hoy = new Date();

    // fecha límite = hoy + 5 días
    const cincoDiasDespues = new Date();
    cincoDiasDespues.setDate(hoy.getDate() + 5);

    const contratos = await ContratoEmpeno.findAll({
      where: {
        estatus: "ACTIVO",
        nuevaFechaCorte: {
          [Op.between]: [hoy, cincoDiasDespues],
        },
      },
      attributes: [
        "id",
        "numeroContrato",
        "nuevaFechaCorte",
        "capitalAdeudado",
        "interesAdeudado",
      ],
      order: [["nuevaFechaCorte", "ASC"]],
    });

    // calcular días restantes para el frontend
    const resultado = contratos.map((c) => {
      const diasRestantes = Math.ceil(
        (new Date(c.nuevaFechaCorte) - hoy) / (1000 * 60 * 60 * 24),
      );

      return {
        id: c.id,
        numeroContrato: c.numeroContrato,
        nuevaFechaCorte: c.nuevaFechaCorte,
        diasRestantes,
        capitalAdeudado: c.capitalAdeudado,
        interesAdeudado: c.interesAdeudado,
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo próximos a vencer" });
  }
};

exports.getEnDeuda = async (req, res) => {
  try {
    const hoy = new Date();

    const contratos = await ContratoEmpeno.findAll({
      where: {
        capitalAdeudado: {
          [Op.gt]: 0
        },
        estatus: "ACTIVO",
        nuevaFechaCorte: {
          [Op.lt]: hoy,
        },
      },
      attributes: [
        "id",
        "numeroContrato",
        "nuevaFechaCorte",
        "capitalAdeudado",
        "interesAdeudado",
        "morosidadAdeudada",
      ],
      order: [["nuevaFechaCorte", "ASC"]],
    });

    const resultado = contratos.map((c) => {
      const diasAtraso = Math.ceil(
        (hoy - new Date(c.nuevaFechaCorte)) / (1000 * 60 * 60 * 24),
      );

      return {
        id: c.id,
        numeroContrato: c.numeroContrato,
        nuevaFechaCorte: c.nuevaFechaCorte,
        diasAtraso,
        capitalAdeudado: c.capitalAdeudado,
        interesAdeudado: c.interesAdeudado,
        morosidadAdeudada: c.morosidadAdeudada,
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo empeños en deuda" });
  }
};


exports.listarContratosEmpeno = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 15 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const whereCondition = search
      ? {
          [Op.or]: [
            { numeroContrato: { [Op.iLike]: `%${search}%` } },
            { '$customer.firstName$': { [Op.iLike]: `%${search}%` } },
            { '$customer.lastName$': { [Op.iLike]: `%${search}%` } },
            { '$customer.numberID$': { [Op.iLike]: `%${search}%` } },
          ],
        }
      : {};

    const { rows, count } = await ContratoEmpeno.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Customer,
          required: false,
        },
      ],
      limit: Number(limit),
      offset,
      order: [['fechaContrato', 'DESC']],
    });

    return res.json({
      data: rows,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Error al listar contratos de empeño',
    });
  }
};


exports.updateContratoEmpeno = async (req, res) => {

  const t = await sequelize.transaction();

  try {

    const { id } = req.params;
    const { contrato, prendas } = req.body;

    // función para evitar "" en campos numeric
    const toNumberOrNull = (value) => {
      if (value === "" || value === undefined) return null;
      return value === null ? null : Number(value);
    };

    // 1. verificar contrato existe
    const contratoDb = await ContratoEmpeno.findByPk(id, { transaction: t });

    if (!contratoDb) {

      await t.rollback();

      return res.status(404).json({
        message: "Contrato no encontrado"
      });

    }

    // función para evitar "" en numeric y FK


// normalizar contrato completo
const contratoUpdate = {
  ...contrato,

  customerId: toNumberOrNull(contrato.customerId),

  montoPrestamo: toNumberOrNull(contrato.montoPrestamo),
  montoMaximoaPrestar: toNumberOrNull(contrato.montoMaximoaPrestar),
  tasaInteres: toNumberOrNull(contrato.tasaInteres),
  interesMensualEfectivo: toNumberOrNull(contrato.interesMensualEfectivo),

  plazoMeses: toNumberOrNull(contrato.plazoMeses),
  periodoGraciaDias: toNumberOrNull(contrato.periodoGraciaDias),

  capitalTotal: toNumberOrNull(contrato.capitalTotal),
  capitalAdeudado: toNumberOrNull(contrato.capitalAdeudado),
  totalPagadoCapital: toNumberOrNull(contrato.totalPagadoCapital),

  interesAdeudado: toNumberOrNull(contrato.interesAdeudado),
  totalPagadoInteres: toNumberOrNull(contrato.totalPagadoInteres),

  morosidadAdeudada: toNumberOrNull(contrato.morosidadAdeudada),
  totalPagadoMorosidad: toNumberOrNull(contrato.totalPagadoMorosidad),
  morosidadTotal: toNumberOrNull(contrato.morosidadTotal),
};

// actualizar contrato
await contratoDb.update(contratoUpdate, { transaction: t });

    // 3. actualizar prendas
    if (Array.isArray(prendas)) {

      for (const prenda of prendas) {

        const prendaDb = await PrendaEmpeno.findByPk(prenda.id, {
          transaction: t
        });

        if (!prendaDb) continue;

        await prendaDb.update({

          nombre: prenda.nombre,
          descripcion: prenda.descripcion,
          categoria: prenda.categoria,

          valorEstimado: toNumberOrNull(prenda.valorEstimado),
          pesoGramos: toNumberOrNull(prenda.pesoGramos),
          kilateje: toNumberOrNull(prenda.kilateje),

          status: prenda.status

        }, { transaction: t });

      }

    }

    // 4. confirmar transacción
    await t.commit();

    // 5. devolver contrato actualizado completo
    const contratoActualizado = await ContratoEmpeno.findByPk(id, {

      include: [
        { association: "customer" },
        { association: "user" },
        { association: "prendaEmpenos" },
        { association: "pagosEmpeños" }
      ]

    });

    res.json(contratoActualizado);

  }
  catch (error) {

    await t.rollback();

    console.error(error);

    res.status(500).json({
      message: "Error al actualizar contrato",
      error: error.message
    });

  }

};


exports.obtenerKpisDashboard = async (req, res) => {
  try {

    const hoy = new Date();

    // =========================
    // EMPEÑOS ACTIVOS
    // =========================

    const empenosActivos = await ContratoEmpeno.count({
      where: {
        estatus: "ACTIVO"
      }
    });

    // =========================
    // PRÓXIMOS A VENCER
    // (5 días antes del corte)
    // =========================

    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() + 5);

    const proximosAVencer = await ContratoEmpeno.count({
      where: {
        estatus: "ACTIVO",
        nuevaFechaCorte: {
          [Op.between]: [hoy, fechaLimite]
        }
      }
    });

    // =========================
    // CONTRATOS EN DEUDA
    // =========================

hoy.setHours(0,0,0,0);

const enDeuda = await ContratoEmpeno.count({
  where: {
    capitalAdeudado: {
          [Op.gt]: 0
        },
    estatus: "ACTIVO",
    [Op.or]: [
      { morosidadAdeudada: { [Op.gt]: 0 } },
      { nuevaFechaCorte: { [Op.lt]: hoy } }
    ]
  }
});

    return res.json({
      empenosActivos,
      proximosAVencer,
      enDeuda
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error obteniendo KPIs del dashboard"
    });

  }
};