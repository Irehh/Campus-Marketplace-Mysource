const { Sequelize } = require('sequelize');
const sequelize = require('../config/config');
const User = require('./user');
const Product = require('./product');
const Business = require('./business');
const Image = require('./image');
const Message = require('./message');
const Comment = require('./comment');
const View = require('./view');
const Verification = require('./verification');
const PushSubscription = require('./pushSubscription');
const Favorite = require('./favorite');

// Define relationships
// User
User.hasMany(Product, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Business, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages', onDelete: 'CASCADE' });
User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages', onDelete: 'CASCADE' });
User.hasMany(Comment, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Favorite, { foreignKey: 'userId', onDelete: 'CASCADE' });

// Product
Product.belongsTo(User, { foreignKey: 'userId' });
Product.hasMany(Image, { foreignKey: 'productId', onDelete: 'CASCADE' });
Product.hasMany(Message, { foreignKey: 'productId', onDelete: 'SET NULL' });
Product.hasMany(Comment, { foreignKey: 'productId', onDelete: 'CASCADE' });
Product.hasMany(View, { foreignKey: 'productId', onDelete: 'CASCADE' });

// Business
Business.belongsTo(User, { foreignKey: 'userId' });
Business.hasMany(Image, { foreignKey: 'businessId', onDelete: 'CASCADE' });
Business.hasMany(Message, { foreignKey: 'businessId', onDelete: 'SET NULL' });
Business.hasMany(Comment, { foreignKey: 'businessId', onDelete: 'CASCADE' });
Business.hasMany(View, { foreignKey: 'businessId', onDelete: 'CASCADE' });

// Image
Image.belongsTo(Product, { foreignKey: 'productId', onDelete: 'CASCADE' });
Image.belongsTo(Business, { foreignKey: 'businessId', onDelete: 'CASCADE' });

// Message
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
Message.belongsTo(Product, { foreignKey: 'productId', onDelete: 'SET NULL' });
Message.belongsTo(Business, { foreignKey: 'businessId', onDelete: 'SET NULL' });

// Comment
Comment.belongsTo(User, { foreignKey: 'userId' });
Comment.belongsTo(Product, { foreignKey: 'productId', onDelete: 'CASCADE' });
Comment.belongsTo(Business, { foreignKey: 'businessId', onDelete: 'CASCADE' });

// View
View.belongsTo(Product, { foreignKey: 'productId', onDelete: 'CASCADE' });
View.belongsTo(Business, { foreignKey: 'businessId', onDelete: 'CASCADE' });

// PushSubscription
PushSubscription.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

// Favorite
Favorite.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

module.exports = {
  sequelize,
  User,
  Product,
  Business,
  Image,
  Message,
  Comment,
  View,
  Verification,
  PushSubscription,
  Favorite,
};