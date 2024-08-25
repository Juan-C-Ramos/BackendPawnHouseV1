const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const Customer = sequelize.define('customer', {
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },    

    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    },

    email: {
        type: DataTypes.STRING,
        allowNull: false
    },

    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },

    typeID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    
    numberID: {
        type: DataTypes.STRING,
        allowNull: false
    },

    photoID: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    nacionality: {
        type: DataTypes.STRING,
        allowNull: false
    },

    addressProvincia: {
        type: DataTypes.STRING,
        allowNull: false
    },
    
    addressDistrito: {
        type: DataTypes.STRING,
        allowNull: false
    },

    addressCorregimiento: {
        type: DataTypes.STRING,
        allowNull: false
    },

    addressBarrio: {
        type: DataTypes.STRING,
        allowNull: false
    },
    
    addressCalle: {
        type: DataTypes.STRING,
        allowNull: false
    },

    addressCasa: {
        type: DataTypes.STRING,
        allowNull: false
    },

    firstReference: {
        type: DataTypes.STRING,
        allowNull: false
    },

    secondReference: {
        type: DataTypes.STRING,
        allowNull: false
    },

    notes: {
        type: DataTypes.TEXT,
        allowNull: false
    }
});

module.exports = Customer;