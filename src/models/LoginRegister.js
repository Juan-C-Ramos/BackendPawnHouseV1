const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const LoginRegister = sequelize.define('loginRegister', {
    locationLong: {
        type: DataTypes.STRING,
        allowNull: false
    },
    locationLat: {
        type: DataTypes.STRING,
        allowNull: false
    },
    dispositivo:{
        type: DataTypes.STRING,
        allowNull: false
    },
    browser: {
        type: DataTypes.STRING,
        allowNull: false
    },
    idUser: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ipAddress:{
        type: DataTypes.STRING,
        allowNull: false
    }

});

module.exports = LoginRegister ;