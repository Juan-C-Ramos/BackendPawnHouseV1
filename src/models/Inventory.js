const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const Inventory = sequelize.define('inventory', {

    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    brand:{
        type: DataTypes.STRING,
        allowNull: false
    },
    model:{
        type: DataTypes.STRING,
        allowNull: false
    },
    serialNumber:{
        type: DataTypes.STRING,
        allowNull: true
    },
    material:{
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isIn: [["Oro", "Plata"]]
        }
    },
    register: {
        type: DataTypes.STRING,
        allowNull: true
    },
    placa: {
        type: DataTypes.STRING,
        allowNull: true
    },
    chasis: {
        type: DataTypes.STRING,
        allowNull: true
    },
    statusItem: {
        type: DataTypes.STRING,
        allowNull: false
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    price: { 
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.00
    },
    value:{
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.00
    },

    isOnSale: { 
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    billNumber:{
        type: DataTypes.STRING,
        allowNull: false
    },
    status:{
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['Vendido', 'En Inventario', "Reclamado"]]
          },
        defaultValue: 'En Inventario'
    }
    //categoriesId for the relation in the index.js file
    //inventoryBillId for the relation in the index.js file
});

module.exports = Inventory;