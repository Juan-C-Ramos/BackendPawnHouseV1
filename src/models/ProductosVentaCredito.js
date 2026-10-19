const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const ProductosVentaCredito = sequelize.define('productos_venta_credito', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ventasCreditoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ventas_creditos',   // o el nombre real de la tabla
      key: 'id'
    }
  },
  marca: {
    type: DataTypes.STRING,
    allowNull: false
  },
  modelo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  serie: {
    type: DataTypes.STRING,
    allowNull: false
  },
  otros: {
    type: DataTypes.STRING,
    allowNull: true
  },
  estado: {                     // nuevo, usado, etc.
    type: DataTypes.STRING,
    allowNull: false
  },
  precioContado: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  financiamiento: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  montoFinanciado: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
});

module.exports = ProductosVentaCredito;