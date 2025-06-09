


"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FiTrash2, FiMinus, FiPlus, FiShoppingCart, FiCreditCard } from "react-icons/fi"
import { useAuth } from "../contexts/AuthContext"
import api from "../utils/api"
import toast from "react-hot-toast"
import PageHeader from "../components/PageHeader"
import EmptyState from "../components/EmptyState"
import Loader from "../components/Loader"

const CartPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [cartSummary, setCartSummary] = useState({
    itemCount: 0,
    subtotal: 0,
    platformFee: 0,
    total: 0,
  })
  const [updatingItems, setUpdatingItems] = useState(new Set())
  const [creatingOrder, setCreatingOrder] = useState(false)

  useEffect(() => {
    if (user) {
      fetchCart()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchCart = async () => {
    try {
      setLoading(true)
      const response = await api.get("/api/cart?calculateFees=true")
      console.log("Cart API Response:", response.data) // Debug log

      if (response.data.success) {
        const { cart, items, itemCount, subtotal, platformFee, total } = response.data.data
        setCart(cart || null)
        setCartItems(items || [])
        setCartSummary({
          itemCount: itemCount || 0,
          subtotal: subtotal || 0,
          platformFee: platformFee || 0,
          total: total || 0,
        })
      } else {
        console.error("Cart API Error:", response.data.message)
        toast.error(response.data.message || "Failed to load cart")
      }
    } catch (error) {
      console.error("Error fetching cart:", error.response?.data || error.message)
      toast.error(error.response?.data?.message || "Failed to load cart")
    } finally {
      setLoading(false)
    }
  }

  const updateCartItem = async (cartItemId, quantity) => {
    if (quantity < 1) {
      removeCartItem(cartItemId)
      return
    }

    setUpdatingItems((prev) => new Set(prev).add(cartItemId))

    try {
      const cartItem = cartItems.find((item) => item.id === cartItemId)
      const response = await api.put(`/api/cart/items/${cartItemId}`, {
        quantity,
        price: cartItem.price,
      })

      if (response.data.success) {
        await fetchCart()
        window.dispatchEvent(new Event("cartUpdated"))
        toast.success("Cart item updated")
      } else {
        toast.error(response.data.message || "Failed to update item")
      }
    } catch (error) {
      console.error("Error updating cart item:", error.response?.data || error.message)
      toast.error(error.response?.data?.message || "Failed to update item")
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(cartItemId)
        return newSet
      })
    }
  }

  const removeCartItem = async (cartItemId) => {
    setUpdatingItems((prev) => new Set(prev).add(cartItemId))

    try {
      const response = await api.delete(`/api/cart/items/${cartItemId}`)

      if (response.data.success) {
        await fetchCart()
        window.dispatchEvent(new Event("cartUpdated"))
        toast.success("Item removed from cart")
      } else {
        toast.error(response.data.message || "Failed to remove item")
      }
    } catch (error) {
      console.error("Error removing cart item:", error.response?.data || error.message)
      toast.error(error.response?.data?.message || "Failed to remove item")
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(cartItemId)
        return newSet
      })
    }
  }

  const clearCart = async () => {
    if (!window.confirm("Are you sure you want to clear your cart?")) return

    try {
      const response = await api.delete("/cart/clear")

      if (response.data.success) {
        await fetchCart()
        window.dispatchEvent(new Event("cartUpdated"))
        toast.success("Cart cleared")
      } else {
        toast.error(response.data.message || "Failed to clear cart")
      }
    } catch (error) {
      console.error("Error clearing cart:", error.response?.data || error.message)
      toast.error(error.response?.data?.message || "Failed to clear cart")
    }
  }

const createOrder = async () => {
  if (cartItems.length === 0) {
    toast.error("Your cart is empty");
    return;
  }

  setCreatingOrder(true);

  try {
    const walletResponse = await apiGet("/api/wallet");
    const { wallet } = walletResponse.data;

    if (wallet.balance < cartSummary.total) {
      toast.error("Insufficient wallet balance. Please deposit funds.");
      setTimeout(() => navigate("/wallet/deposit"), 2000);
      return;
    }

    const response = await apiPost("/api/orders/create", {
      deliveryMethod: "pickup",
      notes: "Order created from cart",
    });

    if (response.data.message === "Orders created successfully") {
      toast.success("Order created successfully!");
      await fetchCart();
      navigate("/orders");
      window.dispatchEvent(new Event("cartUpdated"));
    } else {
      toast.error(response.data.message || "Failed to create order");
    }
  } catch (error) {
    console.error("Error creating order:", error.response?.data || error.message);
    const errorMessage = error.response?.data?.message || "Failed to create order";
    toast.error(errorMessage);

    if (errorMessage.includes("Insufficient")) {
      setTimeout(() => navigate("/wallet/deposit"), 2000);
    }
  } finally {
    setCreatingOrder(false);
  }
};

  
  // Group items by seller
  const groupedItems = cartItems.reduce((groups, item) => {
    const sellerId = item.Product?.User?.id || "unknown"
    if (!groups[sellerId]) {
      groups[sellerId] = {
        seller: item.Product?.User || { name: "Unknown Seller", campus: "Unknown" },
        items: [],
      }
    }
    groups[sellerId].items.push(item)
    return groups
  }, {})

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          icon={FiShoppingCart}
          title="Sign in to view your cart"
          description="You need to be signed in to add items to your cart and make purchases."
          actionText="Sign In"
          actionLink="/login"
        />
      </div>
    )
  }

  if (loading) {
    return <Loader />
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Shopping Cart"
        subtitle={
          cartItems.length === 0
            ? "Your cart is empty"
            : `${cartSummary.itemCount} item${cartSummary.itemCount !== 1 ? "s" : ""} in your cart`
        }
      />

      {cartItems.length === 0 ? (
        <EmptyState
          icon={FiShoppingCart}
          title="Your cart is empty"
          description="Browse our products and add items to your cart to get started."
          actionText="Browse Products"
          actionLink="/products"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(groupedItems).map(([sellerId, group]) => (
              <div key={sellerId} className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="font-medium text-gray-900">Sold by {group.seller?.name}</h3>
                  <p className="text-sm text-gray-500">{group.seller?.campus}</p>
                </div>

                <div className="divide-y">
                  {group.items.map((item) => (
                    <div key={item.id} className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <img
                            src={item.Product?.Images?.[0]?.url || "/placeholder.svg?height=80&width=80"}
                            alt={item.Product?.title || "Product"}
                            className="w-20 h-20 object-cover rounded-md"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {item.Product?.title || "Unknown Product"}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">{item.Product?.category || "N/A"}</p>
                          <p className="text-sm font-medium text-primary-700 mt-1">
                            ₦{Number(item.price).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateCartItem(item.id, item.quantity - 1)}
                            disabled={updatingItems.has(item.id)}
                            className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <FiMinus size={16} />
                          </button>

                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>

                          <button
                            onClick={() => updateCartItem(item.id, item.quantity + 1)}
                            disabled={updatingItems.has(item.id)}
                            className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <FiPlus size={16} />
                          </button>

                          <button
                            onClick={() => removeCartItem(item.id)}
                            disabled={updatingItems.has(item.id)}
                            className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center">
              <button onClick={clearCart} className="text-red-600 hover:text-red-800 text-sm font-medium">
                Clear Cart
              </button>

              <Link to="/products" className="text-primary-700 hover:text-primary-600 text-sm font-medium">
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({cartSummary.itemCount} items)</span>
                  <span>₦{cartSummary.subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Platform Fee</span>
                  <span>₦{cartSummary.platformFee.toLocaleString()}</span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between text-base font-medium">
                    <span>Total</span>
                    <span>₦{cartSummary.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={createOrder}
                  disabled={creatingOrder || cartItems.length === 0}
                  className="w-full bg-primary-700 text-white py-3 px-4 rounded-md font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {creatingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <FiCreditCard className="mr-2" />
                      Place Order
                    </>
                  )}
                </button>

                <div className="text-xs text-gray-500 text-center">
                  <p>💰 Your payment will be held securely in escrow</p>
                  <p>✅ Money is only released when you confirm delivery</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CartPage