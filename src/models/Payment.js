const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const Payment = sequelize.define('payment', {
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    interestAmount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    capital:{
        type: DataTypes.FLOAT,
        allowNull: false
    },
    layPaymentFee:{
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    paymentDate:{
        type: DataTypes.DATEONLY,
        allowNull: false
    }, 
    isRegistered:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    itbms:{
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    paymentMethod:{
        type: DataTypes.STRING,
        allowNull: false
    },

    

    //paymentBill
    //transactionsId 

});

module.exports = Payment;