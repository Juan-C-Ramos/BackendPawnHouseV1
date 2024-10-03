const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const ProfilePhoto = sequelize.define('profilePhoto', {
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false
    },
});

module.exports = ProfilePhoto;  