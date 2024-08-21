const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const User = sequelize.define('user', {
    userName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    
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
        allowNull: true,
        unique: true
    },
        
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },

    profileImg: {
        type: DataTypes.STRING,
        allowNull: false
    },
    
    //roleId
    
});

module.exports = User;