import { Link } from "react-router-dom"

const BusinessCard = ({ business }) => {
  return (
    <Link to={`/businesses/${business.id}`} className="block bg-white shadow rounded-lg overflow-hidden">
      <div className="w-full h-[166px] overflow-hidden">
        <img
          src={business.images && business.images.length > 0 ? business.images[0].url : "/placeholder.jpg"}
          alt={business.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-2">
        <h3 className="text-xs font-medium text-gray-900 truncate">{business.name}</h3>
        <p className="mt-1 text-xs text-gray-500 truncate">{business.category}</p>
      </div>
    </Link>
  )
}

export default BusinessCard

