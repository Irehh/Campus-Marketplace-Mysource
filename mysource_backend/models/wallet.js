// models/Wallet.js
module.exports = (sequelize, DataTypes) => {
  const Wallet = sequelize.define(
    "Wallet",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      balance: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      pendingBalance: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      totalEarned: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      totalSpent: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      lastWithdrawal: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastTransactionAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastBalanceVerification: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      verificationCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: "Users",
          key: "id",
        },
      },
    },
    {
      tableName: "Wallets",
      timestamps: true,
    },
  )

  Wallet.associate = (models) => {
    Wallet.belongsTo(models.User, { foreignKey: "userId" })
    Wallet.hasMany(models.Transaction, { foreignKey: "walletId", onDelete: "SET NULL" })
  }

  return Wallet
}
