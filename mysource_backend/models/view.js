// models/view.js
module.exports = (sequelize, DataTypes) => {
  const View = sequelize.define(
    'View',
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
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    },
    {
      tableName: 'Views',
      timestamps: true,
      updatedAt: false,
      indexes: [
        { unique: true, fields: ['visitorId', 'productId'] },
        { unique: true, fields: ['visitorId', 'businessId'] },
        { fields: ['productId'] },
        { fields: ['businessId'] },
      ],
    }
  );

  View.associate = (models) => {
    View.belongsTo(models.Product, { foreignKey: 'productId', onDelete: 'CASCADE' });
    View.belongsTo(models.Business, { foreignKey: 'businessId', onDelete: 'CASCADE' });
  };

  return View;
};