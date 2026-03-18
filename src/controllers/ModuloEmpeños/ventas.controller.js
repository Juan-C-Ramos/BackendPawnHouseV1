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