// models/Transaction.js
module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define(
    "Transaction",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      type: {
        type: DataTypes.ENUM(
          "deposit", // Money added to wallet
          "withdrawal", // Money withdrawn from wallet
          "escrow", // Money held in escrow for a gig
          "release", // Money released from escrow to freelancer
          "refund", // Money refunded from escrow to client
          "fee", // Platform fee
          "withdrawal_fee", // Fee for withdrawal
        ),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      fee: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          "pending", // Transaction initiated
          "completed", // Transaction completed
          "failed", // Transaction failed
          "cancelled", // Transaction cancelled
        ),
        defaultValue: "pending",
      },
      reference: {
        type: DataTypes.STRING, // Payment reference from Paystack
        allowNull: true,
        unique: true, // Ensure uniqueness for transaction references
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON, // Additional data
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      walletId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Wallets",
          key: "id",
        },
      },
      gigId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Gigs",
          key: "id",
        },
      },
    },
    {
      tableName: "Transactions",
      timestamps: true,
    },
  )

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, { foreignKey: "userId" })
    Transaction.belongsTo(models.Wallet, { foreignKey: "walletId" })
    Transaction.belongsTo(models.Gig, { foreignKey: "gigId" })
  }

  return Transaction
}
