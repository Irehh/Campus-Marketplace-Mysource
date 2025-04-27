const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  campus: {
    type: DataTypes.STRING,
    defaultValue: 'default',
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user',
    allowNull: false,
  },
  googleId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  telegramId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  telegramChatId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  notifyByTelegram: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  needsCampusSelection: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  resetToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
  lastSeen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
  notificationKeywords: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'Users',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['email'] },
    { unique: true, fields: ['googleId'] },
    { unique: true, fields: ['telegramId'] },
  ],
});

module.exports = User;