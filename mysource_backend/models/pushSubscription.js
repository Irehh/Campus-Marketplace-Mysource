const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const PushSubscription = sequelize.define('PushSubscription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  endpoint: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  p256dh: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  auth: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
}, {
  tableName: 'PushSubscriptions',
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['userId'] },
  ],
});

module.exports = PushSubscription;