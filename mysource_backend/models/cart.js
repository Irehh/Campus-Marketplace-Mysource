module.exports = (sequelize, DataTypes) => {
  const Cart = sequelize.define(
    "Cart",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
    },
    {
      tableName: "Carts",
      timestamps: true,
    },
  )

  Cart.associate = (models) => {
    Cart.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    })
    Cart.hasMany(models.CartItem, {
      foreignKey: "cartId",
      onDelete: "CASCADE",
    })
  }

  return Cart
}
