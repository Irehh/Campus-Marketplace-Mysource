module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define(
    "OrderItem",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Orders",
          key: "id",
        },
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Products",
          key: "id",
        },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      productSnapshot: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Snapshot of product details at time of order",
      },
    },
    {
      tableName: "OrderItems",
      timestamps: true,
    },
  )

  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order, {
      foreignKey: "orderId",
      onDelete: "CASCADE",
    })
    OrderItem.belongsTo(models.Product, {
      foreignKey: "productId",
      onDelete: "CASCADE",
    })
  }

  return OrderItem
}
