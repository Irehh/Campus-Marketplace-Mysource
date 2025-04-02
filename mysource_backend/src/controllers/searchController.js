import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Search products and businesses
export const search = async (req, res) => {
  const { q, type = "all", campus } = req.query

  if (!q) {
    return res.status(400).json({ message: "Search query is required" })
  }

  try {
    const searchResults = {}
    const whereClause = campus ? { campus } : {}

    // Search products
    if (type === "all" || type === "products") {
      const products = await prisma.product.findMany({
        where: {
          ...whereClause,
          OR: [
            { description: { contains: q } },
            { category: { contains: q} },
          ],
        },
        include: {
          images: true,
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              website: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 10, // Limit to 10 products
      })

      // Truncate description text to avoid too much text
      searchResults.products = products.map((product) => ({
        ...product,
        description:
          product.description.length > 150 ? product.description.substring(0, 150) + "..." : product.description,
      }))
    }

    // Search businesses
    if (type === "all" || type === "businesses") {
      const businesses = await prisma.business.findMany({
        where: {
          ...whereClause,
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
            { category: { contains: q } },
          ],
        },
        include: {
          images: true,
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              website: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 5, // Limit to 5 businesses
      })

      // Truncate description text to avoid too much text
      searchResults.businesses = businesses.map((business) => ({
        ...business,
        description:
          business.description.length > 150 ? business.description.substring(0, 150) + "..." : business.description,
      }))
    }

    res.json(searchResults)
  } catch (error) {
    console.error("Search error:", error)
    res.status(500).json({ message: "Failed to process search request" })
  }
}

