require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'mysql',
    logging: console.log // Enable SQL logging for debugging
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'mysql',
    logging: false // Disable logging in production
  }
};