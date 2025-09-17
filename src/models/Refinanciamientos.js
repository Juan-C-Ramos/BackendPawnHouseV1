const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const Refinanciamientos = sequelize.define('refinanciamientos', {
    numeroContrato: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    contratosRefinanciados: {
        type: DataTypes.ARRAY(DataTypes.INTEGER), // 👈 Array de enteros
        allowNull: false
    }
});

module.exports = Refinanciamientos;
