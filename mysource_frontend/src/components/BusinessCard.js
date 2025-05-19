


import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { FiClock, FiEye } from "react-icons/fi"
import FavoriteButton from "./FavoriteButton"

const BusinessCard = ({ business }) => {
  const timeAgo = formatDistanceToNow(new Date(business.createdAt), { addSuffix: true })

  return (
    <Link to={`/businesses/${business.id}`} className="block bg-white shadow rounded-lg overflow-hidden">
      <div className="w-full h-[166px] overflow-hidden relative">
        <img
          src={business.Images && business.Images.length > 0 ? business.Images[0].url : "images/placeholder.png"}
          alt={business.name}
          className="w-full h-full object-cover"
        />
        <FavoriteButton 
          itemId={business.id} 
          itemType="business" 
          className="top-2 right-2" 
        />
      </div>
      <div className="p-2">
        <h3 className="text-xs font-medium text-gray-900 truncate">{business.name}</h3>
        <div className="flex justify-between items-center mt-1">
          <div className="flex items-center text-xs text-gray-500">
            <FiClock className="mr-1" size={10} />
            <span>{timeAgo}</span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <FiEye className="mr-1" size={10} />
            <span>{business.viewCount || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default BusinessCard