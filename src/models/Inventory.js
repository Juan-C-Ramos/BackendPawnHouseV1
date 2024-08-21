const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const Inventory = sequelize.define('inventory', {

    name: {
        type: DataTypes.STRING,
        allowNull: false
    },

    img: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    price: { 
        type: DataTypes.FLOAT,
        allowNull: false
    },

    isOnSale: { 
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    //categoriesId for the relation in the index.js file
});

module.exports = Inventory;