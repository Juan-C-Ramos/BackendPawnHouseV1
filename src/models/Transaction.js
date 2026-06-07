const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const Transaction = sequelize.define('transaction', {
    contractNumber:{
        type: DataTypes.STRING,
        allowNull: true
    },

    description: {
        type: DataTypes.STRING,
        allowNull: true
    },

    amonunt: {
        type: DataTypes.FLOAT,
        allowNull: false
    },

    interestsType: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['amortizado', 'abonoCapital', 'otros', 'ventas', 'normal']]
          }
    },

    interestsPorcent: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    interestAmount: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    morosidadAmount: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    nextPaymentDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },

    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },

    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true  
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
        allowNull: true
    },

    capital: {
        type: DataTypes.FLOAT,
        allowNull: true
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
            isIn: [['prestamos', 'venta', 'empeño', 'prestamo refinanciado', 'refinanciamiento', 'abono a capital', 'pago de interes', 'otros pagos']]
          }
    },
    isRegistered: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }


    //contractId
    //inventoriesId
    //customersId
    //usersId
});

module.exports = Transaction;