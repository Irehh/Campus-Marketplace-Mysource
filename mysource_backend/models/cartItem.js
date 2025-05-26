module.exports = (sequelize, DataTypes) => {
  const CartItem = sequelize.define(
    "CartItem",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      cartId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Carts",
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
        validate: {
          min: 1,
        },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      tableName: "CartItems",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["cartId", "productId"],
          name: "unique_cart_product",
        },
      ],
    },
  )

  CartItem.associate = (models) => {
    CartItem.belongsTo(models.Cart, {
      foreignKey: "cartId",
      onDelete: "CASCADE",
    })
    CartItem.belongsTo(models.Product, {
      foreignKey: "productId",
      onDelete: "CASCADE",
      include: ["images", "user"],
    })
  }

  return CartItem
}
