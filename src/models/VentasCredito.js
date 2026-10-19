const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const VentasCredito = sequelize.define('ventas_credito', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  transactionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true, // un contrato por transacción
    references: {
      model: 'transactions',
      key: 'id'
    }
  },
  nombre: {                     // nombre del cliente / comprador
    type: DataTypes.STRING,
    allowNull: false
  },
  facturaNumero: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ventaCreditoNumero: {
    type: DataTypes.STRING,
    allowNull: true
    
  },
  // Totales del contrato
  precioContadoTotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  financiamientoTotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  montoFinanciado: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  abonoInicial: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  saldoCapital: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  saldoFinanciamiento: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  estado: {                     // estado del contrato
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'activo'
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = VentasCredito;