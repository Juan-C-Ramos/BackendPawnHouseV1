const { PrendaEmpeno, ContratoEmpeno } = require("../../models");

const obtenerPrendasPorContrato = async (req, res) => {
  try {
    const { contratoId } = req.params;

    // Verificar que el contrato existe (opcional pero recomendado)
    const contrato = await ContratoEmpeno.findByPk(contratoId);
    if (!contrato) {
      return res.status(404).json({ message: "Contrato no encontrado" });
    }

    const prendas = await PrendaEmpeno.findAll({
      where: { contratoEmpenoId: contratoId },
      order: [["createdAt", "ASC"]],
    });

    return res.json(prendas);
  } catch (error) {
    console.error("Error obteniendo prendas:", error);
    return res.status(500).json({ message: "Error al obtener prendas" });
  }
};

module.exports = {
  obtenerPrendasPorContrato,
};
