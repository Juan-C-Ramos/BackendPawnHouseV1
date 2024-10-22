const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const Transaction = sequelize.define('transaction', {

    description: {
        type: DataTypes.STRING,
        allowNull: false
    },

    amonunt: {
        type: DataTypes.FLOAT,
        allowNull: false
    },

    interestsType: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isIn: [['amortizado', 'abonoCapital', 'otros']]
          }
    },

    interestsPorcent: {
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
        allowNull: true
    },

    cuotesAmount: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0.00
    },

    balance: { 
        type: DataTypes.FLOAT,
        allowNull: false
    },

    capital: {
        type: DataTypes.FLOAT,
        allowNull: false
    },

    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'inProgress'
    }, 
    transactionType:{
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['prestamos', 'venta', 'empeño']]
          }
    }


    //contractId
    //inventoriesId
    //customersId
    //usersId
});

module.exports = Transaction;