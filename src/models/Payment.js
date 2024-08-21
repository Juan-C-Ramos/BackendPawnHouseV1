const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const Payment = sequelize.define('payment', {
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    //transactionsId 

});

module.exports = Payment;