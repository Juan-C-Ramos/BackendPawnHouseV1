const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const ImageInventory = sequelize.define('imageInventory', {
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false
    },
    //inventoryId
 }, {
        timestamps: false
    
});

module.exports = ImageInventory;