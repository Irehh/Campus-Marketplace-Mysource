'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Subscriptions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 4000, // ₦4,000 membership fee
      },
      usageLimit: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 2000, // ₦2,000 usage limit
      },
      remainingLimit: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 2000, // Initial remaining limit
      },
      expiryDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },


    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Subscriptions');
  },
};