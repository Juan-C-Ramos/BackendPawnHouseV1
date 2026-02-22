const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false, timezone: '-05:00' })

module.exports = sequelize;