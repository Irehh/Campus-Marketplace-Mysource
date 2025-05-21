import { Link } from "react-router-dom"
import { FiDollarSign, FiClock, FiEye, FiUsers } from "react-icons/fi"
import { formatCurrency } from "../utils/format"

const GigCard = ({ gig }) => {
  if (!gig) return null

  const truncateDescription = (text, maxLength = 70) => {
    if (!text) return ""
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  // Get the main image if available
  const mainImage =
    gig.Images && gig.Images.length > 0
      ? gig.Images.find((img) => img.isMain)?.url
      : gig.images && gig.images.length > 0
        ? gig.images[0].url
        : null

  return (
    <Link
      to={`/gigs/${gig.id}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Status Badge */}
      <div className="relative">
        <span
          className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full z-10 
            ${
              gig.status === "open"
                ? "bg-green-100 text-green-800"
                : gig.status === "in_progress"
                  ? "bg-blue-100 text-blue-800"
                  : gig.status === "completed"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-red-100 text-red-800"
            }`}
        >
          {gig.status === "open"
            ? "Open"
            : gig.status === "in_progress"
              ? "In Progress"
              : gig.status === "completed"
                ? "Completed"
                : "Cancelled"}
        </span>
      </div>

      <div className="p-4">
        {/* Title and description */}
        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{truncateDescription(gig.description)}</h3>

        {/* Price and duration */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center text-primary font-medium">
            <FiDollarSign className="mr-1" size={14} />
            <span>{formatCurrency(gig.budget)}</span>
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            <FiClock className="mr-1" size={12} />
            <span>
              {gig.duration} day{gig.duration !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Category tag */}
        <div className="mb-2">
          <span className="inline-block bg-primary-50 text-primary-700 text-xs px-2 py-0.5 rounded">
            {gig.category}
          </span>
          {gig.campus && (
            <span className="inline-block bg-gray-50 text-gray-600 text-xs px-2 py-0.5 rounded ml-1">{gig.campus}</span>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <div className="flex items-center">
            <FiEye className="mr-1" size={12} />
            <span>{gig.views || 0} views</span>
          </div>
          <div className="flex items-center">
            <FiUsers className="mr-1" size={12} />
            <span>{gig.bidCount || gig.bids?.length || 0} bids</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default GigCard
