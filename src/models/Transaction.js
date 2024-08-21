const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const Transaction = sequelize.define('transaction', {

    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    photoId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amonunt: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    interests: {
        type: DataTypes.FLOAT,
        allowNull: true
    },

    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },

    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false  
    },
    
    cuotes: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    balance: { 
        type: DataTypes.FLOAT,
        allowNull: false
    },


    contract : {
        type: DataTypes.TEXT,
        allowNull: false
    },
    
    inventoryId : {
        type: DataTypes.INTEGER,
        allowNull: true
    },


    // customersId
    // usersId
});

module.exports = Transaction;