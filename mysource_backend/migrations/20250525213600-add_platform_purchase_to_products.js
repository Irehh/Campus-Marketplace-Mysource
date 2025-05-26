module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Products", "platformPurchaseEnabled", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "Whether this product can be purchased through the platform",
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Products", "platformPurchaseEnabled")
  },
}
