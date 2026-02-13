const {
  ContratoEmpeno,
  Pagos,
  Customer,
  User
} = require('../../models')

exports.estadoCuentaContratoEmpeno = async (req, res) => {
  try {
    const { contratoId } = req.params

    const contrato = await ContratoEmpeno.findByPk(contratoId, {
      include: [
        {
          model: Customer,
          attributes: ['id', 'nombre', 'cedula', 'telefono']
        },
        {
          model: User,
          attributes: ['id', 'name']
        },
        {
          model: Pagos,
          separate: true,
          order: [['fechaPago', 'DESC']],
          include: [
            {
              model: User,
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    })

    if (!contrato) {
      return res.status(404).json({ message: 'Contrato no encontrado' })
    }

    // 🧮 resumen de saldos
    const resumen = {
      capitalOriginal: Number(contrato.capitalTotal),
      capitalAdeudado: Number(contrato.capitalAdeudado),

      interesAdeudado: Number(contrato.interesAdeudado),
      morosidadAdeudada: Number(contrato.morosidadAdeudada),

      totalAdeudado:
        Number(contrato.capitalAdeudado) +
        Number(contrato.interesAdeudado) +
        Number(contrato.morosidadAdeudada)
    }

    res.json({
      contrato: {
        id: contrato.id,
        numeroContrato: contrato.numeroContrato,
        fechaContrato: contrato.fechaContrato,
        estatus: contrato.estatus
      },
      cliente: contrato.Customer,
      usuario: contrato.User,
      resumen,
      pagos: contrato.Pagos.map(p => ({
        id: p.id,
        fechaPago: p.fechaPago,
        numeroPago: p.numeroPago,
        capital: p.montoCapital,
        interes: p.montoInteres,
        morosidad: p.montoMorosidad,
        itbms: p.montoITBMS,
        total: p.montoTotalPago,
        usuario: p.User?.name || null
      }))
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al obtener estado de cuenta' })
  }
}
