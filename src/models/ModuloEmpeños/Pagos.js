const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/connection');

const PagosEmpeños = sequelize.define('pagosEmpeños', {
    // Información del pago
    numeroPago: {
        type: DataTypes.STRING,  // número único del pago (Generar automaticamente con el ID y fecha)
        allowNull: false
    },
    fechaPago: {
        type: DataTypes.DATE, // fecha en que se realiza el pago
        allowNull: false
    },
    // Detalles del pago  (Capital)
    montoCapital: {
        type: DataTypes.DECIMAL(10, 2),  // parte del pago que se aplica al capital
        allowNull: false
    },
    montoCapitalNuevo: {
        type: DataTypes.DECIMAL(10, 2), // capital despues del pago
        allowNull: false
    },
    montoCapitalAnterior: {
        type: DataTypes.DECIMAL(10, 2), // capital antes del pago
        allowNull: false
    },
    // Detalles del pago (Interes)
    montoInteres: {
        type: DataTypes.DECIMAL(10, 2), // parte del pago que se aplica al interes 
        allowNull: false
    },
    montoInteresNuevo: {
        type: DataTypes.DECIMAL(10, 2), // interes despues del pago
        allowNull: false
    },
    montoInteresAnterior: {
        type: DataTypes.DECIMAL(10, 2), // interes antes del pago
        allowNull: false
    },
    // Detalles del pago (Morosidad)
    montoMorosidad: {
        type: DataTypes.DECIMAL(10, 2), // parte del pago que se aplica a la morosidad
        allowNull: false
    },
    montoMorosidadNuevo: {
        type: DataTypes.DECIMAL(10, 2), // morosidad despues del pago
        allowNull: false
    },
    montoMorosidadAnterior: {
        type: DataTypes.DECIMAL(10, 2), // morosidad antes del pago
        allowNull: false
    },
    // Detalles del pago (ITBMS)
    montoITBMS: {
        type: DataTypes.DECIMAL(10, 2), // ITBMS cobrado en este pago
        allowNull: false
    },
    // Control del pago
    estatusPago: {
        type: DataTypes.STRING, // Ejemplo: "PENDIENTE", "COMPLETADO", "CANCELADO"
        allowNull: false,
        defaultValue: 'PENDIENTE'
    },
    metodoPago: {
        type: DataTypes.STRING, // Ejemplo: "Efectivo", "Tarjeta de Crédito", "Transferencia Bancaria", etc.
        allowNull: false
    },
    // Monto total del pago
    montoTotalPago: {
        type: DataTypes.DECIMAL(10, 2), // suma de capital, interes, morosidad e ITBMS(monto recibido del cliente)
        allowNull: false
    }


    // Relaciones
    // contratoEmpeñoId (para saber a que contrato pertenece este pago)
    // usuarioId (para saber que usuario registro el pago)
    // clienteId (para saber que cliente hizo el pago)
    

});

module.exports = PagosEmpeños;