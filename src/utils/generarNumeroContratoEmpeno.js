const { Op } = require('sequelize')
const ContratoEmpeno = require('../models/ModuloEmpeños/ContratoEmpeño')

module.exports = async (fecha, transaction) => {
  const start = new Date(fecha)
  start.setHours(0, 0, 0, 0)

  const end = new Date(fecha)
  end.setHours(23, 59, 59, 999)

  const count = await ContratoEmpeno.count({
    where: {
      fechaContrato: {
        [Op.between]: [start, end]
      }
    },
    transaction
  })

  const correlativo = String(count + 1).padStart(5, '0')

  const yyyy = start.getFullYear()
  const mm = String(start.getMonth() + 1).padStart(2, '0')
  const dd = String(start.getDate()).padStart(2, '0')

  return `EMP-${yyyy}${mm}${dd}-${correlativo}`
}
