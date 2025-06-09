// models/index.js
const { Sequelize, DataTypes } = require("sequelize")
const sequelize = require("../config/database")

// Import models
const User = require("./user")(sequelize, DataTypes)
const Product = require("./product")(sequelize, DataTypes)
const Business = require("./business")(sequelize, DataTypes)
const Image = require("./image")(sequelize, DataTypes)
const Message = require("./message")(sequelize, DataTypes)
const Comment = require("./comment")(sequelize, DataTypes)
const View = require("./view")(sequelize, DataTypes)
const Verification = require("./verification")(sequelize, DataTypes)
const PushSubscription = require("./pushSubscription")(sequelize, DataTypes)
const Favorite = require("./favorite")(sequelize, DataTypes)
const Notification = require("./notification")(sequelize, DataTypes)
const Gig = require("./gig")(sequelize, DataTypes)
const Bid = require("./bid")(sequelize, DataTypes)
const Wallet = require("./wallet")(sequelize, DataTypes)
const Transaction = require("./transaction")(sequelize, DataTypes)
const Cart = require("./cart")(sequelize, DataTypes)
const CartItem = require("./cartItem")(sequelize, DataTypes)
const Order = require("./order")(sequelize, DataTypes)
const OrderItem = require("./orderItem")(sequelize, DataTypes)

// Define relationships
const models = {
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
  Notification,
  Gig,
  Bid,
  Wallet,
  Transaction,
  Cart,
  CartItem,
  Order,
  OrderItem,
}

Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models)
  }
})

module.exports = {
  sequelize,
  Sequelize,
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
  Notification,
  Gig,
  Bid,
  Wallet,
  Transaction,
  Cart,
  CartItem,
  Order,
  OrderItem,
}
