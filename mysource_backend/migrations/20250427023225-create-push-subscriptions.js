'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PushSubscriptions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      endpoint: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      p256dh: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      auth: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('PushSubscriptions', ['userId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PushSubscriptions');
  },
};