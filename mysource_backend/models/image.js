const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const Image = sequelize.define('Image', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'Images',
  timestamps: false,
});

module.exports = Image;