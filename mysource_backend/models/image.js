const gig = require("./gig");

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
        references: {
          model: 'Products',
          key: 'id',
        },
      },
      businessId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Businesses',
          key: 'id',
        },
      },
      gigId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Gigs',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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