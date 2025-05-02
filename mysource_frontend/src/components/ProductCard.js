import { Link } from "react-router-dom"
import { formatCurrency } from "../utils/format"
import { formatDistanceToNow } from "date-fns"
import { FiClock, FiEye } from "react-icons/fi"
import FavoriteButton from "./FavoriteButton"

const ProductCard = ({ product }) => {
  // Extract the first line or first 30 characters of description for display
  const shortDescription = product.description.split("\n")[0] || product.description.substring(0, 30)
  const timeAgo = formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })

  return (
    <Link to={`/products/${product.id}`} className="block bg-white shadow rounded-lg overflow-hidden">
      <div className="w-full h-[166px] overflow-hidden relative">
        <img
          src={product.images && product.images.length > 0 ? product.images[0].url : "/placeholder.jpg"}
          alt={shortDescription}
          className="w-full h-full object-cover"
        />
        <FavoriteButton 
          itemId={product.id} 
          itemType="product" 
          className="top-2 right-2" 
        />
      </div>
      <div className="p-2">
        <div className="flex justify-between items-start">
          <h3 className="text-xs font-medium text-gray-900 truncate">{shortDescription}</h3>
          <p className="text-xs font-medium text-primary">{formatCurrency(product.price)}</p>
        </div>
        <div className="flex justify-between items-center mt-1">
          <div className="flex items-center text-xs text-gray-500">
            <FiClock className="mr-1" size={10} />
            <span>{timeAgo}</span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <FiEye className="mr-1" size={10} />
            <span>{product.viewCount || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard