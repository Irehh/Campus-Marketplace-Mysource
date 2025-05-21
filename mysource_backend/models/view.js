module.exports = (sequelize, DataTypes) => {
  const View = sequelize.define(
    "View",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      visitorId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      businessId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      gigId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "Views",
      timestamps: false,
    },
  )

  View.associate = (models) => {
    View.belongsTo(models.Product, { foreignKey: "productId", onDelete: "CASCADE" })
    View.belongsTo(models.Business, { foreignKey: "businessId", onDelete: "CASCADE" })
    View.belongsTo(models.Gig, { foreignKey: "gigId", onDelete: "CASCADE" })
  }

  return View
}
