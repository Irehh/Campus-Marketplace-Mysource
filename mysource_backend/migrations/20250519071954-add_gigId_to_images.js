'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Images", "gigId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Gigs",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Images", "gigId")
  },
};
