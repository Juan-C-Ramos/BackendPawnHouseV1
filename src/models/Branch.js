const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const Branch = sequelize.define('branch', {
    brancName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    brancAdress: {
        type: DataTypes.STRING,
        allowNull: false
    },
    brancPhone: {
        type: DataTypes.STRING,
        allowNull: false
    },
});

module.exports = Branch