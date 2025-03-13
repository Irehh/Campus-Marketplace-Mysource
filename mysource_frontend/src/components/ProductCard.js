import { Link } from "react-router-dom"
import { formatCurrency } from "../utils/format"

const ProductCard = ({ product }) => {
  // Extract the first line or first 30 characters of description for display
  const shortDescription = product.description.split("\n")[0] || product.description.substring(0, 30)

  return (
    <Link to={`/products/${product.id}`} className="block bg-white shadow rounded-lg overflow-hidden">
      <div className="w-full h-[166px] overflow-hidden">
        <img
          src={product.images && product.images.length > 0 ? product.images[0].url : "/placeholder.jpg"}
          alt={shortDescription}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-2">
        <h3 className="text-xs font-medium text-gray-900 truncate">{shortDescription}</h3>
        <p className="mt-1 text-xs text-gray-500">{formatCurrency(product.price)}</p>
      </div>
    </Link>
  )
}

export default ProductCard

