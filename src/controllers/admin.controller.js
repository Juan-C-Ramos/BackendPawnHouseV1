const sequelize = require('../utils/connection');
const { Transaction } = require("../models");
const catchError = require("../utils/catchError");

const corregirPrestamos = catchError(async (req, res) => {
  const [updated] = await Transaction.update(
    {
      interestsType: "abonoCapital",
    },
    {
      where: {
        interestsType: "amortizado",
      },
    }
  );

  res.json({
    updated,
  });
});

module.exports = {
  corregirPrestamos,
};