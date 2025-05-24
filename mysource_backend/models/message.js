// models/message.js
module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    'Message',
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
      read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      receiverId: {
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
      gigId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Gigs',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    },
    {
      tableName: 'Messages',
      timestamps: true,
      updatedAt: false,
      indexes: [
        { fields: ['senderId'] },
        { fields: ['receiverId'] },
        { fields: ['productId'] },
        { fields: ['businessId'] },
      ],
    }
  );

  Message.associate = (models) => {
    Message.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender', onDelete: 'CASCADE' });
    Message.belongsTo(models.User, { foreignKey: 'receiverId', as: 'receiver', onDelete: 'CASCADE' });
    Message.belongsTo(models.Product, { foreignKey: 'productId', onDelete: 'SET NULL' });
    Message.belongsTo(models.Business, { foreignKey: 'businessId', onDelete: 'SET NULL' });
    Message.belongsTo(models.Gig, {
      foreignKey: "gigId",
      as: "gig",
      onDelete: "SET NULL",
    })
  };

  return Message;
};