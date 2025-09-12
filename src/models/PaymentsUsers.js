const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const PaymentUsers = sequelize.define('paymentUsers', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    paymentId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = PaymentUsers;