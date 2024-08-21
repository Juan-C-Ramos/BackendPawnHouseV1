const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const Role = sequelize.define('role', {
    roleName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
});

module.exports = Role;