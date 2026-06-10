const { DataTypes } = require("sequelize");

const sequelize = require("../utils/connection");

const DisbursementAccount = sequelize.define("disbursementAccount", {
  bankName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  transactionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
});

exports = module.exports = DisbursementAccount;