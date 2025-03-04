const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const Cuote = sequelize.define('cuote', {
    cuoteNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    capitalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    totalPaid: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    amountInterest: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    paymentCutDate: {
        type: DataTypes.DATEONLY,
    },
    latePaymentAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    idOfTransaction: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['paid', 'notPaid', "deposit"]]
          },
        defaultValue: 'notPaid'
    }
});

module.exports = Cuote;