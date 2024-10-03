const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const Contract = sequelize.define('contract', {
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false
    },
});

module.exports = Contract;