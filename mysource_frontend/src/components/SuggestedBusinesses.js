

import { useState, useEffect } from "react"
import axios from "axios"
import BusinessCard from "./BusinessCard"

const SuggestedBusinesses = ({ currentBusinessId, category, campus }) => {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSuggestedBusinesses = async () => {
      try {
        const response = await axios.get("/api/businesses", {
          params: {
            category,
            campus,
            limit: 4,
          },
        })

        // Filter out the current business
        const filteredBusinesses = response.data.businesses.filter((business) => business.id !== currentBusinessId)

        setBusinesses(filteredBusinesses.slice(0, 4))
      } catch (error) {
        console.error("Error fetching suggested businesses:", error)
      } finally {
        setLoading(false)
      }
    }

    if (category && campus) {
      fetchSuggestedBusinesses()
    } else {
      setLoading(false)
    }
  }, [currentBusinessId, category, campus])

  if (loading) {
    return <div className="text-center py-2">Loading suggestions...</div>
  }

  if (businesses.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2">
      {businesses.map((business) => (
        <BusinessCard key={business.id} business={business} />
      ))}
    </div>
  )
}

export default SuggestedBusinesses

