const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const IdPhoto = sequelize.define('idPhoto', {
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },

    filename: {
        type: DataTypes.STRING,
        allowNull: false
    },
});

module.exports = IdPhoto;