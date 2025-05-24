module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Messages", "gigId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Gigs",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Messages", "gigId")
  },
}