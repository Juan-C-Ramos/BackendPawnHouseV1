const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const HistorialSaldo = sequelize.define('historialSaldo', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    pagoId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    saldoAnterior: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    nuevoSaldo: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
}, {
    timestamps: true, // agrega createdAt y updatedAt
    updatedAt: false  // no nos interesa updatedAt
});

module.exports = HistorialSaldo;
