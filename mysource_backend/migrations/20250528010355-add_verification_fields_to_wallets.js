module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Wallets", "lastTransactionAt", {
      type: Sequelize.DATE,
      allowNull: true,
    })

    await queryInterface.addColumn("Wallets", "lastBalanceVerification", {
      type: Sequelize.DATE,
      allowNull: true,
    })

    await queryInterface.addColumn("Wallets", "verificationCount", {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Wallets", "lastTransactionAt")
    await queryInterface.removeColumn("Wallets", "lastBalanceVerification")
    await queryInterface.removeColumn("Wallets", "verificationCount")
  },
}
