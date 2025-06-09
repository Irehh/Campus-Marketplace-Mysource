"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../utils/format";
import { formatDistanceToNow } from "date-fns";
import { FiClock, FiEye, FiShoppingCart } from "react-icons/fi";
import FavoriteButton from "./FavoriteButton";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";
import toast from "react-hot-toast";

const ProductCard = ({ product }) => {
  const { user } = useAuth();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Extract the first line or first 30 characters of description
  const shortDescription = product.description.split("\n")[0].substring(0, 30);
  const timeAgo = formatDistanceToNow(new Date(product.createdAt), { addSuffix: true });

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to add items to cart");
      return;
    }

    if (product.userId === user.id) {
      toast.error("You cannot add your own product to cart");
      return;
    }

    if (!product.platformPurchaseEnabled) {
      toast.error("This product is not available for online purchase");
      return;
    }

    setIsAddingToCart(true);

    try {
      const response = await api.post("/api/cart/add", {
        productId: product.id,
        quantity: 1,
        price: product.price,
      });

      if (response.data.success) {
        toast.success("Product added to cart!");
        window.dispatchEvent(new Event("cartUpdated"));
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="block bg-white shadow rounded-lg overflow-hidden"
    >
      <div className="w-full h-[166px] overflow-hidden relative group">
        <img
          src={product.Images && product.Images.length > 0 ? product.Images[0].url : "/images/placeholder.png"}
          alt={shortDescription}
          className="w-full h-full object-cover"
        />
        <FavoriteButton itemId={product.id} itemType="product" className="absolute top-2 right-2" />
        {product.platformPurchaseEnabled && user && product.userId !== user.id && (
          <div className="absolute bottom-2 right-2 group-hover:tooltip">
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="w-6 h-6 bg-[#00b53f] text-white rounded-full flex items-center justify-center hover:bg-[#009f36] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddingToCart ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <FiShoppingCart size={12} />
              )}
            </button>
            <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded -top-8 right-0 transform translate-x-[-10%] whitespace-nowrap">
              Add to Cart
            </span>
          </div>
        )}
      </div>
      <div className="p-2">
        <div className="flex justify-between items-start">
          <h3 className="text-xs font-medium text-gray-900 truncate" title={product.description}>
            {shortDescription}
          </h3>
          <p className="text-xs font-medium text-[#00b53f]">{formatCurrency(product.price)}</p>
        </div>
        <div className="flex justify-between items-center mt-1">
          <div className="flex items-center text-[10px] text-gray-500">
            <FiClock className="mr-1" size={10} />
            <span>{timeAgo}</span>
          </div>
          <div className="flex items-center text-[10px] text-gray-500">
            <FiEye className="mr-1" size={10} />
            <span>{product.viewCount || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;