// models/verification.js
module.exports = (sequelize, DataTypes) => {
  const Verification = sequelize.define(
    'Verification',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      telegramChatId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    },
    {
      tableName: 'Verifications',
      timestamps: true,
      updatedAt: false,
      indexes: [
        { fields: ['telegramChatId'] },
      ],
    }
  );

  Verification.associate = (models) => {
    // No associations defined in original models/index.js
  };

  return Verification;
};