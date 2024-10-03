const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const InventoryBill = sequelize.define('inventoryBill', {
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false
    },
});

module.exports = InventoryBill;