const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const View = sequelize.define('View', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  visitorId: {
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
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
}, {
  tableName: 'Views',
  timestamps: true,
  updatedAt: false,
  indexes: [
    { unique: true, fields: ['visitorId', 'productId'] },
    { unique: true, fields: ['visitorId', 'businessId'] },
    { fields: ['productId'] },
    { fields: ['businessId'] },
  ],
});

module.exports = View;