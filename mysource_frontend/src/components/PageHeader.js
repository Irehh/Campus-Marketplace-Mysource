import React from "react"

const PageHeader = ({ title, subtitle, action }) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}

export default PageHeader