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
        allowNull: false,
    },

    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },

    typeID: {
        type: DataTypes.STRING,
        allowNull: true
    },
    
    numberID: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },

    nacionality: {
        type: DataTypes.STRING,
        allowNull: true
    },

    addressProvincia: {
        type: DataTypes.STRING,
        allowNull: true
    },
    
    addressDistrito: {
        type: DataTypes.STRING,
        allowNull: true
    },

    addressCorregimiento: {
        type: DataTypes.STRING,
        allowNull: true
    },

    addressBarrio: {
        type: DataTypes.STRING,
        allowNull: true
    },
    
    addressCalle: {
        type: DataTypes.STRING,
        allowNull: true
    },

    addressCasa: {
        type: DataTypes.STRING,
        allowNull: true
    },

    firstReference: {
        type: DataTypes.STRING,
        allowNull: true
    },

    secondReference: {
        type: DataTypes.STRING,
        allowNull: true
    },

    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'active'
    }
    
});

module.exports = Customer;