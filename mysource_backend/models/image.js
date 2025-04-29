// models/image.js
module.exports = (sequelize, DataTypes) => {
  const Image = sequelize.define(
    'Image',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      thumbnailUrl: {
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
    },
    {
      tableName: 'Images',
      timestamps: false,
    }
  );

  Image.associate = (models) => {
    Image.belongsTo(models.Product, { foreignKey: 'productId', onDelete: 'CASCADE' });
    Image.belongsTo(models.Business, { foreignKey: 'businessId', onDelete: 'CASCADE' });
  };

  return Image;
};