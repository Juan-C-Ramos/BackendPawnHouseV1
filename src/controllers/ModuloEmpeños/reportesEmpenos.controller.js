// GET /empenos/reportes/ingresos?desde=2026-01-01&hasta=2026-01-31
// GET /empenos/reportes/activos
// GET /empenos/reportes/vencidos
// GET /empenos/reportes/resumen-kpi

const { Op } = require("sequelize");
const {
  Pagos,
  ContratoEmpeno,
  Customer,
  User,
} = require("../../models");

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

module.exports = {
  reporteIngresos,
  obtenerKpisReportes,
  obtenerContratosActivos,
  obtenerContratosEnDeuda,
  obtenerContratosVencidos
};