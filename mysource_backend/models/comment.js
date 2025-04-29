// models/comment.js
module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define(
    'Comment',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      content: {
        type: DataTypes.TEXT,
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
      tableName: 'Comments',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['productId'] },
        { fields: ['businessId'] },
      ],
    }
  );

  Comment.associate = (models) => {
    Comment.belongsTo(models.User, { foreignKey: 'userId', onDelete: 'CASCADE' });
    Comment.belongsTo(models.Product, { foreignKey: 'productId', onDelete: 'CASCADE' });
    Comment.belongsTo(models.Business, { foreignKey: 'businessId', onDelete: 'CASCADE' });
  };

  return Comment;
};