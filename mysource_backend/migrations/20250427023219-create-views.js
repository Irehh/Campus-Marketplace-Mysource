'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Views', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      visitorId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Products',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      businessId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Businesses',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('Views', ['visitorId', 'productId'], { unique: true });
    await queryInterface.addIndex('Views', ['visitorId', 'businessId'], { unique: true });
    await queryInterface.addIndex('Views', ['productId']);
    await queryInterface.addIndex('Views', ['businessId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Views');
  },
};