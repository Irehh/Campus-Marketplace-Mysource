import React from "react"
import { Link } from "react-router-dom"

const EmptyState = ({ message, actionText, actionLink, icon: Icon }) => {
  return (
    <div className="text-center py-8 px-4">
      {Icon && <Icon className="mx-auto h-12 w-12 text-gray-400" />}
      <h3 className="mt-2 text-sm font-medium text-gray-900">{message}</h3>
      {actionText && actionLink && (
        <div className="mt-6">
          <Link
            to={actionLink}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {actionText}
          </Link>
        </div>
      )}
    </div>
  )
}

export default EmptyState