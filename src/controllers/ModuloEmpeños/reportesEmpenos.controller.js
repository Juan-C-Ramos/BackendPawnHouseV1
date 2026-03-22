// GET /empenos/reportes/ingresos?desde=2026-01-01&hasta=2026-01-31
// GET /empenos/reportes/activos
// GET /empenos/reportes/vencidos
// GET /empenos/reportes/resumen-kpi

const { Op, fn, col, literal } = require("sequelize");
const {
  Pagos,
  ContratoEmpeno,
  Customer,
  User,
  Venta,
  PrendaEmpeno

} = require("../../models");
const sequelize = require("../../utils/connection");

const reporteIngresos = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    if (!desde || !hasta) {
      return res.status(400).json({
        message: "Debe enviar fecha desde y hasta",
      });
    }

    const fechaInicio = new Date(`${desde}T00:00:00`);
    const fechaFin = new Date(`${hasta}T23:59:59`);

    const pagos = await Pagos.findAll({
      where: {
        fechaPago: {
          [Op.between]: [fechaInicio, fechaFin],
        }
      },
      include: [
        {
          model: ContratoEmpeno,
          attributes: ["numeroContrato"],
          include: [
            {
              model: Customer,
              attributes: ["firstName", "lastName"],
            },
          ],
        },
        {
          model: User,
          attributes: ["firstName", "lastName"],
        },
      ],
      order: [["fechaPago", "DESC"]],
    });

    const resultado = pagos.map((pago) => {
      const contrato = pago.contratoEmpeno;
      const cliente = contrato?.customer;
      const usuario = pago.user;

      return {
        fecha: pago.fechaPago.toISOString().split("T")[0],
        contrato: contrato?.numeroContrato || "N/A",
        cliente: cliente
          ? `${cliente.firstName} ${cliente.lastName}`
          : "N/A",
        capital: Number(pago.montoCapital || 0),
        interes: Number(pago.montoInteres || 0),
        morosidad: Number(pago.montoMorosidad || 0),
        itbms: Number(pago.montoITBMS || 0),
        totalRecibido: Number(pago.montoTotalPago || 0),
        metodo: pago.metodoPago,
        usuario: usuario
          ? `${usuario.firstName} ${usuario.lastName}`
          : "N/A",
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error("Error reporte ingresos:", error);
    res.status(500).json({
      message: "Error generando reporte de ingresos",
    });
  }
};


const obtenerKpisReportes = async (req, res) => {
  try {

    const hoy = new Date();

    const inicioMes = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      1
    );

    const finMes = new Date(
      hoy.getFullYear(),
      hoy.getMonth() + 1,
      0
    );

    // ======================
    // INGRESOS DEL MES
    // ======================

    const pagosMes = await Pagos.sum("montoTotalPago", {
      where: {
        fechaPago: {
          [Op.between]: [inicioMes, finMes]
        }
      }
    });

    // ======================
    // CONTRATOS ACTIVOS
    // ======================

    const contratosActivos = await ContratoEmpeno.count({
      where: {
        estatus: "ACTIVO"
      }
    });

    // ======================
    // CONTRATOS VENCIDOS
    // ======================

    const contratosVencidos = await ContratoEmpeno.count({
      where: {
        capitalAdeudado: {
          [Op.gt]: 0
        },
        nuevaFechaCorte: {
          [Op.lt]: hoy
        },
        estatus: "ACTIVO"
      }
    });

    return res.json({
      ingresosMes: pagosMes || 0,
      contratosActivos,
      contratosVencidos
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error obteniendo KPIs"
    });

  }
};

// controllers/reportes/contratosActivos.controller.js


const obtenerContratosActivos = async (req, res) => {
  try {

    const contratos = await ContratoEmpeno.findAll({
      where: {
        estatus: "ACTIVO"
      },
      include: [
        {
          model: Customer,
          attributes: ["firstName", "lastName", "numberID"]
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(contratos);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo contratos activos" });
  }
};


const obtenerContratosEnDeuda = async (req, res) => {
  try {

    const hoy = new Date();

    const contratos = await ContratoEmpeno.findAll({
      where: {
        capitalAdeudado: {
          [Op.gt]: 0
        },
        nuevaFechaCorte: {
          [Op.gte]: hoy
        }
      },
      include: [
        {
          model: Customer,
          attributes: ["firstName", "lastName"]
        }
      ],
      order: [["nuevaFechaCorte", "ASC"]]
    });

    res.json(contratos);

  } catch (error) {
    console.error("Error obteniendo contratos en deuda:", error);
    res.status(500).json({ error: "Error obteniendo contratos en deuda" });
  }
};

const obtenerContratosVencidos = async (req, res) => {
  try {

    const hoy = new Date();

    const contratos = await ContratoEmpeno.findAll({
      where: {
        capitalAdeudado: {
          [Op.gt]: 0
        },
        nuevaFechaCorte: {
          [Op.lte]: hoy
        },
        estatus: "ACTIVO"
      },
      include: [
        {
          model: Customer,
          attributes: ["firstName", "lastName"]
        }
      ],
      order: [["nuevaFechaCorte", "ASC"]]
    });

    res.json(contratos);

  } catch (error) {
    console.error("Error obteniendo contratos vencidos:", error);
    res.status(500).json({ error: "Error obteniendo contratos vencidos" });
  }
};




const reporteLiquidacionPrendas = async (req, res) => {

  try {

    const { desde, hasta } = req.query;

    // =========================
    // VALIDACIONES
    // =========================

    if (!desde || !hasta) {
      return res.status(400).json({
        error: "Debe enviar las fechas 'desde' y 'hasta'"
      });
    }

    const fechaDesde = new Date(desde);
    const fechaHasta = new Date(hasta);

    if (isNaN(fechaDesde) || isNaN(fechaHasta)) {
      return res.status(400).json({
        error: "Formato de fecha inválido"
      });
    }

    if (fechaDesde > fechaHasta) {
      return res.status(400).json({
        error: "La fecha 'desde' no puede ser mayor que 'hasta'"
      });
    }

    // =========================
    // CONSULTA
    // =========================

    const ventas = await Venta.findAll({

      where: {
        fechaVenta: {
          [Op.between]: [desde, hasta]
        }
      },

      include: [
        {
          model: ContratoEmpeno,
          attributes: [
            "id",
            "numeroContrato",
            "fechaContrato",
            "montoPrestamo",
            "montoMaximoaPrestar",
            "interesAdeudado"
          ]
        },
        {
          model: PrendaEmpeno,
          attributes: [
            "id",
            "descripcion"
          ]
        }
      ],

      order: [["fechaVenta", "ASC"]]

    });

    // =========================
    // MAPEO PARA EL REPORTE
    // =========================

    const reporte = ventas.map(v => {

      const contrato = v.contratoEmpeno;
      const prenda = v.prendaEmpeno;

      if (!contrato || !prenda) {
        return null;
      }

      const montoPrestado = Number(contrato.montoPrestamo) || 0;
      const montoMaximo = Number(contrato.montoMaximoaPrestar) || 0;
      const intereses = Number(contrato.interesAdeudado) || 0;
      const precioVenta = Number(v.precioVenta) || 0;

      const saldoCliente =
        precioVenta - (montoPrestado + intereses);

      return {

        numeroContrato: contrato.numeroContrato,

        fechaContrato: contrato.fechaContrato,

        articulo: prenda.descripcion,

        montoMaximo: montoMaximo,

        montoPrestado: montoPrestado,

        interesesAdeudados: intereses,

        valorVenta: precioVenta,

        saldoCliente: saldoCliente > 0
          ? Number(saldoCliente.toFixed(2))
          : 0

      };

    }).filter(Boolean);

    // =========================
    // RESPUESTA
    // =========================

    return res.json({
      totalRegistros: reporte.length,
      desde,
      hasta,
      data: reporte
    });

  } catch (error) {

    console.error("Error reporte MISI:", error);

    return res.status(500).json({
      error: "Error generando el reporte de liquidación de prendas"
    });

  }
};

const obtenerIngresosAnuales = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    console.log("Generando reporte de ingresos para el año:", year);

    const inicio = new Date(`${year}-01-01`);
    const fin = new Date(`${year}-12-31`);

    // =========================
    // 1. CAPITAL PRESTADO
    // =========================
    const prestamos = await ContratoEmpeno.findAll({
      attributes: [
        [literal('EXTRACT(MONTH FROM "fechaContrato")'), "mes"],
        [fn("SUM", col("montoPrestamo")), "capitalPrestado"]
      ],
      where: {
        fechaContrato: { [Op.between]: [inicio, fin] }
      },
      group: [literal('EXTRACT(MONTH FROM "fechaContrato")')],
      raw: true
    });

    // =========================
    // 2. PAGOS
    // =========================
    const pagos = await Pagos.findAll({
      attributes: [
        [literal('EXTRACT(MONTH FROM "fechaPago")'), "mes"],
        [fn("SUM", col("montoInteres")), "intereses"],
        [fn("SUM", col("montoCapital")), "capitalRecuperado"]
      ],
      where: {
        fechaPago: { [Op.between]: [inicio, fin] }
      },
      group: [literal('EXTRACT(MONTH FROM "fechaPago")')],
      raw: true
    });

    // =========================
    // 3. ARMAR MESES
    // =========================
    const meses = [
      "Enero","Febrero","Marzo","Abril","Mayo","Junio",
      "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
    ];

    const resultado = meses.map((nombre, index) => {
      const mesNum = index + 1;

      const prestamoMes = prestamos.find(p => Number(p.mes) === mesNum) || {};
      const pagoMes = pagos.find(p => Number(p.mes) === mesNum) || {};

      return {
        mes: nombre,
        capitalPrestado: Number(prestamoMes.capitalPrestado) || 0,
        intereses: Number(pagoMes.intereses) || 0,
        capitalRecuperado: Number(pagoMes.capitalRecuperado) || 0,
        capitalAdeudado: 0
      };
    });

    // =========================
    // 4. ADEUDADO ACUMULADO
    // =========================
    let acumuladoPrestado = 0;
    let acumuladoRecuperado = 0;

    resultado.forEach((mes) => {
      acumuladoPrestado += mes.capitalPrestado;
      acumuladoRecuperado += mes.capitalRecuperado;

      mes.capitalAdeudado = acumuladoPrestado - acumuladoRecuperado;
    });

    res.json(resultado);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al generar reporte" });
  }
};


const obtenerIngresosPorMes = async (req, res) => {
  try {
    const year = parseInt(req.query.year);
    const mes = parseInt(req.query.mes); // 1 - 12

    if (!year || !mes) {
      return res.status(400).json({ message: "year y mes son requeridos" });
    }

    // =========================
    // RANGO DE FECHAS
    // =========================
    const inicio = new Date(year, mes - 1, 1);
    const fin = new Date(year, mes, 0, 23, 59, 59); // último día del mes

    // =========================
    // 1. PRESTAMOS
    // =========================
    const prestamos = await ContratoEmpeno.findAll({
      attributes: [
        [literal('EXTRACT(DAY FROM "fechaContrato")'), "dia"],
        [fn("SUM", col("montoPrestamo")), "capitalPrestado"]
      ],
      where: {
        fechaContrato: { [Op.between]: [inicio, fin] }
      },
      group: [literal('EXTRACT(DAY FROM "fechaContrato")')],
      raw: true
    });

    // =========================
    // 2. PAGOS
    // =========================
    const pagos = await Pagos.findAll({
      attributes: [
        [literal('EXTRACT(DAY FROM "fechaPago")'), "dia"],
        [fn("SUM", col("montoInteres")), "intereses"],
        [fn("SUM", col("montoCapital")), "capitalRecuperado"]
      ],
      where: {
        fechaPago: { [Op.between]: [inicio, fin] }
      },
      group: [literal('EXTRACT(DAY FROM "fechaPago")')],
      raw: true
    });

    // =========================
    // 3. GENERAR DÍAS DEL MES
    // =========================
    const diasEnMes = new Date(year, mes, 0).getDate();

    const resultado = [];

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const prestamoDia = prestamos.find(p => Number(p.dia) === dia) || {};
      const pagoDia = pagos.find(p => Number(p.dia) === dia) || {};

      resultado.push({
        dia,
        capitalPrestado: Number(prestamoDia.capitalPrestado) || 0,
        intereses: Number(pagoDia.intereses) || 0,
        capitalRecuperado: Number(pagoDia.capitalRecuperado) || 0,
        capitalAdeudado: 0
      });
    }

    // =========================
    // 4. ADEUDADO ACUMULADO
    // =========================
    let acumuladoPrestado = 0;
    let acumuladoRecuperado = 0;

    resultado.forEach((d) => {
      acumuladoPrestado += d.capitalPrestado;
      acumuladoRecuperado += d.capitalRecuperado;

      d.capitalAdeudado = acumuladoPrestado - acumuladoRecuperado;
    });

    res.json(resultado);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al generar reporte mensual" });
  }
};

// GET /reportes-empenos/misi/reporte-anual?anio=2025

const reporteAnualMICI = async (req, res) => {
  try {
    const { desde, hasta } = req.query;


    const resultado = await sequelize.query(`
      SELECT
        p.categoria,
        COUNT(p.id) AS cantidad_prendas,
        SUM(p."valorEstimado") AS valor_total
      FROM "prendaEmpenos" p
      JOIN "contratoEmpenos" ce 
        ON p."contratoEmpenoId" = ce.id
      WHERE ce."fechaContrato" BETWEEN :desde AND :hasta
      GROUP BY p.categoria
      ORDER BY p.categoria
    `, {
      replacements: { desde, hasta },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({data: resultado});

  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Error generando reporte MICI"
    });
  }
};

module.exports = {
  reporteIngresos,
  obtenerKpisReportes,
  obtenerContratosActivos,
  obtenerContratosEnDeuda,
  obtenerContratosVencidos,
  reporteLiquidacionPrendas,
  obtenerIngresosAnuales,
  obtenerIngresosPorMes,
  reporteAnualMICI
};