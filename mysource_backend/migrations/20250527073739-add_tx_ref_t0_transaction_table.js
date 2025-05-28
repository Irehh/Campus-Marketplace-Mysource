'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('Transactions', 'tx_ref', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true, // Ensure uniqueness for transaction references
      comment: 'Transaction reference from gateway transactions',
      after: 'reference' // Position after the existing 'reference' column
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropColumn('tx_ref')
  }
};
