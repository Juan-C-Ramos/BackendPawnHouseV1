const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/connection');

const ContratoEmpeno = sequelize.define('contratoEmpeno', {

    // Información del contrato
    numeroContrato: {
        type: DataTypes.STRING,  // número único del contrato Generar automaticamente con el ID y fecha (aun no se como hacerlo automatico)
        allowNull: false,
        unique:true
    },
    fechaContrato: {
        type: DataTypes.DATE,
        allowNull: false
    },
    montoPrestamo: {
        type: DataTypes.DECIMAL(10, 2),  // monto que se presta al cliente(puede ser menor o igual al montoMaximoaPrestar)
        allowNull: false
    },
    montoMaximoaPrestar: {
        type: DataTypes.DECIMAL(10, 2),  // valor maximo que se puede prestar basado en las prendas empeñadas
        allowNull: false
    },
    tasaInteres: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    interesMensualEfectivo: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    plazoMeses: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    periodoGraciaDias: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    personaAutorizada: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cedulaPersonaAutorizada: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // Campos para control

    estatus: {
        type: DataTypes.ENUM('ACTIVO', 'VENCIDO', 'PAGADO', 'PERDIDO', 'CANCELADO'),
        allowNull: false,
        defaultValue: 'ACTIVO'
    },

    //campos para pagos
        //capital

    totalPagadoCapital: {
        type: DataTypes.DECIMAL(10, 2),  // lo que ya se ha pagado (se actualiza con cada pago)
        allowNull: false,
        defaultValue: 0.00
    },
    capitalAdeudado: {
        type: DataTypes.DECIMAL(10, 2),  //lo que falta por pagar(se actualiza con cada pago)
        allowNull: false,
        defaultValue: 0.00
    },
    capitalTotal: {
        type: DataTypes.DECIMAL(10, 2),  //es lo que se presto inicialmente
        allowNull: false,
        defaultValue: 0.00
    },
        //interes
    totalPagadoInteres: {
        type: DataTypes.DECIMAL(10, 2),  //lo que ya se ha pagado (se actualiza con cada pago)
        allowNull: false,
        defaultValue: 0.00
    },
    interesAdeudado: {
        type: DataTypes.DECIMAL(10, 2), //lo que falta por pagar(se actualiza con cada pago, y suma el interes que no se pague)
        allowNull: false,
        defaultValue: 0.00
    },
    ultimaFechaPagoInteres: {
        type: DataTypes.DATE,  //se usa para calcular el interes moratorio
        allowNull: true
    },
        //morosidad
    totalPagadoMorosidad: {
        type: DataTypes.DECIMAL(10, 2), //lo que ya se ha pagado (se actualiza con cada pago)
        allowNull: false,
        defaultValue: 0.00
    },
    morosidadAdeudada: {
        type: DataTypes.DECIMAL(10, 2), //lo que falta por pagar(se actualiza con cada pago)
        allowNull: false,
        defaultValue: 0.00
    },
    morosidadTotal: {
        type: DataTypes.DECIMAL(10, 2), //es lo que se ha generado por morosidad
        allowNull: false,
        defaultValue: 0.00
    },
    nuevaFechaCorte: {
        type: DataTypes.DATEONLY,
        allowNull:true
    },
    anteriorFechaCorte: {
        type: DataTypes.DATEONLY,
        allowNull:true
    },

    

    //relaciones
    //clienteid
    // usuarioId
    //prendaEmpeñoId(pueden ser varias prendas)
    //pagoId(son varios pagos)
    
    customerId: {
  type: DataTypes.INTEGER,
  allowNull: false
},
userId: {
  type: DataTypes.INTEGER,
  allowNull: false
}



});

module.exports = ContratoEmpeno;