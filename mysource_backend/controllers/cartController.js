const { Cart, CartItem, Product, Image, User } = require("../models")

const addToCart = async (req, res) => {
  try {
    const userId = req.user.id
    const { productId, quantity, price } = req.body

    // Find the user's cart or create a new one
    let cart = await Cart.findOne({ where: { userId } })

    if (!cart) {
      cart = await Cart.create({ userId })
    }

    // Find the product
    const product = await Product.findByPk(productId)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    if (!product.platformPurchaseEnabled) {
      return res.status(400).json({
        success: false,
        message: "This product is not available for platform purchase. Please contact the seller directly.",
      })
    }

    // Find the cart item if it exists
    let cartItem = await CartItem.findOne({
      where: { cartId: cart.id, productId },
    })

    if (cartItem) {
      // Update the quantity and price
      cartItem.quantity = quantity
      cartItem.price = price
      await cartItem.save()
    } else {
      // Create a new cart item
      cartItem = await CartItem.create({
        cartId: cart.id,
        productId,
        quantity,
        price,
      })
    }

    res.status(201).json({
      success: true,
      message: "Product added to cart",
      data: cartItem,
    })
  } catch (error) {
    console.error("Error adding to cart:", error)
    res.status(500).json({
      success: false,
      message: "Failed to add product to cart",
      error: error.message,
    })
  }
}

const getCart = async (req, res) => {
  try {
    const userId = req.user.id
    const { calculateFees = true } = req.query

    const cart = await Cart.findOne({
      where: { userId },
      include: [
        {
          model: CartItem,
          include: [
            {
              model: Product,
              where: {
                platformPurchaseEnabled: true, // Only show platform-purchasable products
              },
              include: [
                {
                  model: Image,
                  limit: 1,
                },
                {
                  model: User,
                  attributes: ["id", "name", "campus"],
                },
              ],
            },
          ],
        },
      ],
    })

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          cart: null,
          items: [],
          itemCount: 0,
          subtotal: 0,
          platformFee: 0,
          total: 0,
        },
      })
    }

    // Calculate totals
    const subtotal = cart.CartItems.reduce((total, item) => {
      return total + Number.parseFloat(item.price) * item.quantity
    }, 0)

    let feePreview = { platformFee: 0, total: subtotal }

    if (calculateFees === "true" && cart.CartItems.length > 0) {
      const { getCartFeePreview } = require("../utils/feeCalculator")
      feePreview = getCartFeePreview(cart.CartItems, req.user.campus)
    }

    res.status(200).json({
      success: true,
      data: {
        cart,
        items: cart.CartItems,
        itemCount: cart.CartItems.length,
        subtotal,
        platformFee: feePreview.platformFee || 0,
        total: feePreview.total || subtotal,
        feeDetails: feePreview.feeDetails || null,
      },
    })
  } catch (error) {
    console.error("Error getting cart:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get cart",
      error: error.message,
    })
  }
}

const updateCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.params
    const { quantity, price } = req.body

    const cartItem = await CartItem.findByPk(cartItemId)

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      })
    }

    cartItem.quantity = quantity
    cartItem.price = price
    await cartItem.save()

    res.status(200).json({
      success: true,
      message: "Cart item updated",
      data: cartItem,
    })
  } catch (error) {
    console.error("Error updating cart item:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update cart item",
      error: error.message,
    })
  }
}

const removeCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.params

    const cartItem = await CartItem.findByPk(cartItemId)

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      })
    }

    await cartItem.destroy()

    res.status(200).json({
      success: true,
      message: "Cart item removed",
    })
  } catch (error) {
    console.error("Error removing cart item:", error)
    res.status(500).json({
      success: false,
      message: "Failed to remove cart item",
      error: error.message,
    })
  }
}

const clearCart = async (req, res) => {
  try {
    const userId = req.user.id

    const cart = await Cart.findOne({ where: { userId } })

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      })
    }

    await CartItem.destroy({ where: { cartId: cart.id } })

    res.status(200).json({
      success: true,
      message: "Cart cleared",
    })
  } catch (error) {
    console.error("Error clearing cart:", error)
    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message,
    })
  }
}

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
}
