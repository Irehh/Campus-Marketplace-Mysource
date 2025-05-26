module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("CartItems", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      cartId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Carts",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Products",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
        },
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    })

    // Add indexes for faster queries
    await queryInterface.addIndex("CartItems", ["cartId"])
    await queryInterface.addIndex("CartItems", ["productId"])

    // Add unique constraint to prevent duplicate items in same cart
    await queryInterface.addIndex("CartItems", ["cartId", "productId"], {
      unique: true,
      name: "unique_cart_product",
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("CartItems")
  },
}
