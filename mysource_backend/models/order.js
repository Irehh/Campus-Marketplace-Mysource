module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    "Order",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      orderNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      buyerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      sellerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      platformFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM("pending", "confirmed", "shipped", "delivered", "completed", "cancelled", "disputed"),
        allowNull: false,
        defaultValue: "pending",
      },
      deliveryStatus: {
        type: DataTypes.ENUM(
          "pending",
          "preparing",
          "ready_for_pickup",
          "in_transit",
          "delivered",
          "confirmed_by_buyer",
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      escrowReleased: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deliveryAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      deliveryMethod: {
        type: DataTypes.ENUM("pickup", "campus_delivery", "meetup"),
        allowNull: false,
        defaultValue: "pickup",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      buyerNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sellerNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      deliveryConfirmedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      buyerConfirmedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      escrowReleasedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      campus: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "Orders",
      timestamps: true,
    },
  )

  Order.associate = (models) => {
    Order.belongsTo(models.User, {
      foreignKey: "buyerId",
      as: "buyer",
      onDelete: "CASCADE",
    })
    Order.belongsTo(models.User, {
      foreignKey: "sellerId",
      as: "seller",
      onDelete: "CASCADE",
    })
    Order.hasMany(models.OrderItem, {
      foreignKey: "orderId",
      onDelete: "CASCADE",
    })
  }

  // Generate order number
  Order.generateOrderNumber = () => {
    const timestamp = Date.now().toString()
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `ORD-${timestamp}-${random}`
  }

  return Order
}
