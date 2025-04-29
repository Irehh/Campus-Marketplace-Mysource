// models/user.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
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
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      verificationToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      verificationExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'Users',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['email'] },
        { unique: true, fields: ['googleId'] },
        { unique: true, fields: ['telegramId'] },
      ],
    }
  );

  User.associate = (models) => {
    User.hasMany(models.Product, { foreignKey: 'userId', onDelete: 'CASCADE' });
    User.hasMany(models.Business, { foreignKey: 'userId', onDelete: 'CASCADE' });
    User.hasMany(models.Message, { foreignKey: 'senderId', as: 'sentMessages', onDelete: 'CASCADE' });
    User.hasMany(models.Message, { foreignKey: 'receiverId', as: 'receivedMessages', onDelete: 'CASCADE' });
    User.hasMany(models.Comment, { foreignKey: 'userId', onDelete: 'CASCADE' });
    User.hasMany(models.Favorite, { foreignKey: 'userId', onDelete: 'CASCADE' });
    User.hasMany(models.PushSubscription, { foreignKey: 'userId', onDelete: 'CASCADE' });
  };

  return User;
};