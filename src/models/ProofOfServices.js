const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const ProofOfServices = sequelize.define('proofOfServices', {
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false
    },
});

module.exports = ProofOfServices;