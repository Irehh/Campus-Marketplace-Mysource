const { Sequelize } = require('sequelize');

const sequelize =
  global.sequelize ||
  new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });

if (process.env.NODE_ENV !== 'production') global.sequelize = sequelize;

module.exports = sequelize;