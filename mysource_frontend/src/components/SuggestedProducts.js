"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import ProductCard from "./ProductCard"

const SuggestedProducts = ({ currentProductId, category, campus }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSuggestedProducts = async () => {
      try {
        const response = await axios.get("/api/products", {
          params: {
            category,
            campus,
            limit: 4,
          },
        })

        // Filter out the current product
        const filteredProducts = response.data.products.filter((product) => product.id !== currentProductId)

        setProducts(filteredProducts.slice(0, 4))
      } catch (error) {
        console.error("Error fetching suggested products:", error)
      } finally {
        setLoading(false)
      }
    }

    if (category && campus) {
      fetchSuggestedProducts()
    } else {
      setLoading(false)
    }
  }, [currentProductId, category, campus])

  if (loading) {
    return <div className="text-center py-2">Loading suggestions...</div>
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export default SuggestedProducts

