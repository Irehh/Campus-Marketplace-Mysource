// models/favorite.js
module.exports = (sequelize, DataTypes) => {
  const Favorite = sequelize.define(
    'Favorite',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      itemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      itemType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    },
    {
      tableName: 'Favorites',
      timestamps: true,
      updatedAt: false,
      indexes: [
        { unique: true, fields: ['userId', 'itemId', 'itemType'] },
      ],
    }
  );

  Favorite.associate = (models) => {
    Favorite.belongsTo(models.User, { foreignKey: 'userId', onDelete: 'CASCADE' });
    // Note: No direct Product association due to polymorphic itemId/itemType
  };

  return Favorite;
};