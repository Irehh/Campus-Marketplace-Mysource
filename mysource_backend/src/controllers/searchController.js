import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Search products and businesses
export const search = async (req, res) => {
  const { q, type = "all", campus } = req.query

  if (!q) {
    return res.status(400).json({ message: "Search query is required" })
  }

  const searchResults = {}
  const whereClause = campus ? { campus } : {}

  // Search products
  if (type === "all" || type === "products") {
    const products = await prisma.product.findMany({
      where: {
        ...whereClause,
        OR: [
          { description: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        images: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    })

    searchResults.products = products
  }

  // Search businesses
  if (type === "all" || type === "businesses") {
    const businesses = await prisma.business.findMany({
      where: {
        ...whereClause,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        images: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    })

    searchResults.businesses = businesses
  }

  res.json(searchResults)
}

