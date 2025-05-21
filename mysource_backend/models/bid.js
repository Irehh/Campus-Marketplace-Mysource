// models/Bid.js
module.exports = (sequelize, DataTypes) => {
  const Bid = sequelize.define(
    "Bid",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      proposal: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      deliveryTime: {
        type: DataTypes.INTEGER, // In days
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          "pending", // Waiting for client response
          "accepted", // Client accepted this bid
          "rejected", // Client rejected this bid
          "withdrawn", // Freelancer withdrew this bid
        ),
        defaultValue: "pending",
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      gigId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Gigs",
          key: "id",
        },
      },
    },
    {
      tableName: "Bids",
      timestamps: true,
    },
  )

  Bid.associate = (models) => {
    Bid.belongsTo(models.User, { foreignKey: "userId", as: "bidder" })
    Bid.belongsTo(models.Gig, { foreignKey: "gigId" })
  }

  return Bid
}
