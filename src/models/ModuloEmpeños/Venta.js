const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/connection');

const Venta = sequelize.define('venta', {
    contratoEmpenoId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  prendaEmpenoId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  precioVenta: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },

  fechaVenta: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  observacion: {
    type: DataTypes.TEXT
  }
});

module.exports = Venta;