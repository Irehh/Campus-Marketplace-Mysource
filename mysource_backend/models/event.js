// models/event.js
module.exports = (sequelize, DataTypes) => {
    const Event = sequelize.define(
      'Event',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        startDate: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        endDate: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        location: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        campus: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        image: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('active', 'cancelled', 'completed'),
          defaultValue: 'active',
        },
      },
      {
        tableName: 'Events',
        timestamps: true,
      }
    );
  
    Event.associate = (models) => {
      Event.belongsTo(models.User, { foreignKey: 'userId', onDelete: 'CASCADE' });
      Event.belongsTo(models.Business, { foreignKey: 'businessId', onDelete: 'SET NULL' });
    };
  
    return Event;
  };