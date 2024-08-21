const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const MainData = sequelize.define('mainData', {

    capital: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
        
    description: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
        
});

module.exports = MainData;