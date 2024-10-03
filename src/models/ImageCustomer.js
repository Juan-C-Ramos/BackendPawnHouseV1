const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const ImageCustomer = sequelize.define('imageCustomers', {
    campo1: {
        type: DataTypes.STRING,
        allowNull: false
    },
});

module.exports = ImageCustomer;