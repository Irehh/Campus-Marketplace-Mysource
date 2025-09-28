// models/subscription.js
module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define(
    'Subscription',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 4000, // ₦4,000 membership fee
      },
      usageLimit: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 2000, // ₦2,000 usage limit
      },
      remainingLimit: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 2000, // Initial remaining limit
      },
      expiryDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      tableName: 'Subscriptions',
      timestamps: true,
    }
  );

  return Subscription;
};