// models/conversation.js
module.exports = (sequelize, DataTypes) => {
    const Conversation = sequelize.define(
      'Conversation',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        lastMessageAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
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
        tableName: 'Conversations',
        timestamps: true,
      }
    );
  
    Conversation.associate = (models) => {
      Conversation.belongsTo(models.Product, { foreignKey: 'productId', onDelete: 'SET NULL' });
      Conversation.belongsTo(models.Business, { foreignKey: 'businessId', onDelete: 'SET NULL' });
      Conversation.hasMany(models.Message, { foreignKey: 'conversationId', onDelete: 'CASCADE' });
      Conversation.belongsToMany(models.User, {
        through: 'ConversationParticipants',
        foreignKey: 'conversationId',
        otherKey: 'userId',
        onDelete: 'CASCADE',
      });
    };
  
    return Conversation;
  };