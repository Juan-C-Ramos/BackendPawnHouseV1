const {Venta, ContratoEmpeno} = require("../../models");
const PrendaEmpeno = require("../../models/ModuloEmpeños/PrendaEmpeño");
const sequelize = require("../../utils/connection");

exports.registrarVenta = async (req, res) => {

  const t = await sequelize.transaction();

  try {

    const {
      contratoEmpenoId,
      prendaEmpenoId,
      precioVenta,
      fechaVenta,
      observacion
    } = req.body;

    // =========================
    // VALIDACIONES
    // =========================

    if (!precioVenta || precioVenta <= 0) {
      await t.rollback();
      return res.status(400).json({
        error: "Precio de venta inválido"
      });
    }

    const prenda = await PrendaEmpeno.findByPk(prendaEmpenoId, {
      transaction: t
    });

    if (!prenda) {
      await t.rollback();
      return res.status(404).json({
        error: "Prenda no encontrada"
      });
    }

    if (prenda.status !== "DISPONIBLE_VENTA") {
      await t.rollback();
      return res.status(400).json({
        error: "La prenda no está disponible para venta"
      });
    }

    // =========================
    // CREAR VENTA
    // =========================

    const venta = await Venta.create({
      contratoEmpenoId,
      prendaEmpenoId,
      precioVenta,
      fechaVenta: fechaVenta || new Date(),
      observacion
    }, { transaction: t });

    // =========================
    // ACTUALIZAR PRENDA
    // =========================

    prenda.status = "VENDIDO";

    await prenda.save({ transaction: t });

    await t.commit();

    return res.status(201).json({
      message: "Venta registrada correctamente",
      venta
    });

  } catch (error) {

    await t.rollback();

    console.error("Error registrando venta:", error);

    return res.status(500).json({
      error: "Error al registrar venta"
    });

  }

};

const { Op } = require("sequelize");

exports.getPrendasDisponibles = async (req, res) => {

  try {

    const { search } = req.query;

    // =========================
    // CONSTRUIR WHERE DINÁMICO
    // =========================

    const where = {
      status: "DISPONIBLE_VENTA"
    };

    if (search && search.trim() !== "") {
      where.nombre = {
        [Op.like]: `%${search.trim()}%`
      };
    }

    // =========================
    // QUERY
    // =========================

    const prendas = await PrendaEmpeno.findAll({
      where,
      include: [
        {
          model: ContratoEmpeno,
          attributes: ["id", "numeroContrato"]
        }
      ]
    });

    res.json(prendas);

  } catch (error) {

    console.error("Error obteniendo prendas:", error);

    res.status(500).json({
      error: "Error obteniendo prendas"
    });

  }

};

// =========================
// GET ALL VENTAS
// =========================
exports.getAllVentas = async (req, res) => {
  try {
    const { search, desde, hasta } = req.query;

    const where = {};

    // Filtro por fecha
    if (desde || hasta) {
      where.fechaVenta = {};
      if (desde) where.fechaVenta[Op.gte] = desde;
      if (hasta) where.fechaVenta[Op.lte] = hasta;
    }

    const ventas = await Venta.findAll({
      where,
      include: [
        {
          model: PrendaEmpeno,
          attributes: ["id", "nombre", "descripcion", "status", "montoAvaluo"],
          where:
            search && search.trim() !== ""
              ? { nombre: { [Op.like]: `%${search.trim()}%` } }
              : undefined,
          required: false, // left join para no filtrar ventas sin match si no hay search
        },
        {
          model: ContratoEmpeno,
          attributes: ["id", "numeroContrato"],
        },
      ],
      order: [["fechaVenta", "DESC"]],
    });

    // Si hay search y usamos required:false, filtramos en JS las que sí hicieron match
    // Alternativa más limpia si siempre quieres filtrar por nombre de prenda:
    // cambia required a true cuando haya search

    return res.json(ventas);
  } catch (error) {
    console.error("Error obteniendo ventas:", error);
    return res.status(500).json({
      error: "Error obteniendo ventas",
    });
  }
};

// =========================
// GET ONE VENTA
// =========================
exports.getVentaById = async (req, res) => {
  try {
    const { id } = req.params;

    const venta = await Venta.findByPk(id, {
      include: [
        {
          model: PrendaEmpeno,
          attributes: ["id", "nombre", "descripcion", "status", "montoAvaluo"],
        },
        {
          model: ContratoEmpeno,
          attributes: ["id", "numeroContrato"],
        },
      ],
    });

    if (!venta) {
      return res.status(404).json({
        error: "Venta no encontrada",
      });
    }

    return res.json(venta);
  } catch (error) {
    console.error("Error obteniendo venta:", error);
    return res.status(500).json({
      error: "Error obteniendo venta",
    });
  }
};

// =========================
// UPDATE VENTA
// =========================
exports.updateVenta = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { precioVenta, fechaVenta, observacion } = req.body;

    const venta = await Venta.findByPk(id, { transaction: t });

    if (!venta) {
      await t.rollback();
      return res.status(404).json({
        error: "Venta no encontrada",
      });
    }

    // Validar precio si viene
    if (precioVenta !== undefined) {
      if (precioVenta <= 0) {
        await t.rollback();
        return res.status(400).json({
          error: "Precio de venta inválido",
        });
      }
      venta.precioVenta = precioVenta;
    }

    if (fechaVenta !== undefined) {
      venta.fechaVenta = fechaVenta;
    }

    if (observacion !== undefined) {
      venta.observacion = observacion;
    }

    await venta.save({ transaction: t });
    await t.commit();

    return res.json({
      message: "Venta actualizada correctamente",
      venta,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error actualizando venta:", error);
    return res.status(500).json({
      error: "Error al actualizar venta",
    });
  }
};