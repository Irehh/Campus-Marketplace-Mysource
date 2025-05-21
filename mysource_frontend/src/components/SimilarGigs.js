"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { formatCurrency } from "../utils/format"
import { FiDollarSign } from "react-icons/fi"

const SimilarGigs = ({ currentGigId, category, campus }) => {
  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSimilarGigs = async () => {
      if (!category || !campus) return

      try {
        setLoading(true)
        const response = await axios.get("/api/gigs", {
          params: {
            category,
            campus,
            limit: 4,
          },
        })

        // Filter out the current gig and limit to 3
        const filteredGigs = response.data.data
          ? response.data.data.filter((gig) => gig.id !== Number(currentGigId)).slice(0, 3)
          : []

        setGigs(filteredGigs)
      } catch (error) {
        console.error("Error fetching similar gigs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSimilarGigs()
  }, [currentGigId, category, campus])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg h-36 animate-pulse"></div>
        ))}
      </div>
    )
  }

  if (gigs.length === 0) {
    return <p className="text-gray-500 text-center">No similar gigs found.</p>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {gigs.map((gig) => (
        <Link
          key={gig.id}
          to={`/gigs/${gig.id}`}
          className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="p-3">
            <h3 className="font-medium text-gray-900 mb-2 truncate">{gig.description}</h3>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-primary font-semibold">
                <FiDollarSign className="mr-1" size={14} />
                {formatCurrency(gig.budget)}
              </div>
              <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded">{gig.category}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default SimilarGigs
