module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Orders", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      orderNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      buyerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      platformFee:{
        type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Platform fee charged for this order",
      },
      subtotal: {

        type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Order subtotal before platform fee",
      },
      sellerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("pending", "confirmed", "shipped", "delivered", "completed", "cancelled", "disputed"),
        allowNull: false,
        defaultValue: "pending",
      },
      deliveryStatus: {
        type: Sequelize.ENUM(
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
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deliveryAddress: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      deliveryMethod: {
        type: Sequelize.ENUM("pickup", "campus_delivery", "meetup"),
        allowNull: false,
        defaultValue: "pickup",
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      buyerNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sellerNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      deliveryConfirmedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      buyerConfirmedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      escrowReleasedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      campus: {
        type: Sequelize.STRING,
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
    await queryInterface.addIndex("Orders", ["buyerId"])
    await queryInterface.addIndex("Orders", ["sellerId"])
    await queryInterface.addIndex("Orders", ["status"])
    await queryInterface.addIndex("Orders", ["deliveryStatus"])
    await queryInterface.addIndex("Orders", ["campus"])
    await queryInterface.addIndex("Orders", ["orderNumber"])
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Orders")
  },
}
