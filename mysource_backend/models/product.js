// models/product.js
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      campus: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      isDisabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      disabledReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'Products',
      timestamps: true,
      indexes: [
        { fields: ['campus'] },
        { fields: ['category'] },
      ],
    }
  );

  Product.associate = (models) => {
    Product.belongsTo(models.User, { foreignKey: 'userId', onDelete: 'CASCADE' });
    Product.hasMany(models.Image, { foreignKey: 'productId', onDelete: 'CASCADE' });
    Product.hasMany(models.Message, { foreignKey: 'productId', onDelete: 'SET NULL' });
    Product.hasMany(models.Comment, { foreignKey: 'productId', onDelete: 'CASCADE' });
    Product.hasMany(models.View, { foreignKey: 'productId', onDelete: 'CASCADE' });
  };

  return Product;
};