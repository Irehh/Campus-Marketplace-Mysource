import prisma from "../db.js";
import { processImage } from "../utils/imageUtils.js";

// Create a new product
export const createProduct = async (req, res) => {
  const { description, price, category } = req.body;
  const userId = req.user.id; // Assumed to be an integer from auth middleware
  const campus = req.user.campus;

  try {
    if (!description) {
      return res.status(400).json({ message: "Description is required" });
    }

    const product = await prisma.product.create({
      data: {
        description,
        price: price ? Number.parseFloat(price) : null,
        category,
        campus,
        userId,
        isDisabled: false,
        viewCount: 0,
      },
    });

    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map(async (file) => {
        const imageData = await processImage(file);
        return prisma.image.create({
          data: {
            url: imageData.url,
            thumbnailUrl: imageData.thumbnailUrl,
            productId: product.id, // Already an integer from Prisma
          },
        });
      });

      await Promise.all(imagePromises);
    }

    const createdProduct = await prisma.product.findUnique({
      where: { id: product.id }, // Already an integer
      include: {
        images: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json(createdProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Failed to create product" });
  }
};

// Update an existing product
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const productId = parseInt(id); // Convert string to integer
  const { title, description, price, category, campus } = req.body;
  const userId = req.user.id; // Assumed to be an integer

  if (isNaN(productId)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }, // Use parsed integer
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (existingProduct.userId !== userId && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Not authorized to update this product" });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId }, // Use parsed integer
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(price && { price: Number.parseFloat(price) }),
        ...(category && { category }),
        ...(campus && { campus }),
      },
    });

    if (req.files && req.files.length > 0) {
      if (req.body.replaceImages === "true") {
        await prisma.image.deleteMany({
          where: { productId: productId }, // Use parsed integer
        });
      }

      const imagePromises = req.files.map(async (file) => {
        const imageData = await processImage(file);
        return prisma.image.create({
          data: {
            url: imageData.url,
            thumbnailUrl: imageData.thumbnailUrl,
            productId: productId, // Use parsed integer
          },
        });
      });

      await Promise.all(imagePromises);
    }

    const product = await prisma.product.findUnique({
      where: { id: productId }, // Use parsed integer
      include: {
        images: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Failed to update product" });
  }
};

// Delete a product
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const productId = parseInt(id); // Convert string to integer
  const userId = req.user.id; // Assumed to be an integer

  if (isNaN(productId)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }, // Use parsed integer
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (existingProduct.userId !== userId && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Not authorized to delete this product" });
    }

    await prisma.image.deleteMany({
      where: { productId: productId }, // Use parsed integer
    });

    await prisma.view.deleteMany({
      where: { productId: productId }, // Use parsed integer
    });

    await prisma.product.delete({
      where: { id: productId }, // Use parsed integer
    });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

// Get multiple products with filters
export const getProducts = async (req, res) => {
  const { campus, category, limit = 20, page = 1 } = req.query;
  const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit);

  const where = {};
  if (campus) where.campus = campus;
  if (category) where.category = category;

  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN")) {
    where.isDisabled = false;
  }

  try {
    const products = await prisma.product.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
      take: Number.parseInt(limit),
      skip,
    });

    const total = await prisma.product.count({ where });

    res.json({
      products,
      pagination: {
        total,
        page: Number.parseInt(page),
        pageSize: Number.parseInt(limit),
        totalPages: Math.ceil(total / Number.parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// Get products for the authenticated user
export const getUserProducts = async (req, res) => {
  const userId = req.user.id; // Assumed to be an integer

  try {
    const products = await prisma.product.findMany({
      where: { userId }, // Already an integer
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
    });

    res.json({
      products,
    });
  } catch (error) {
    console.error("Error fetching user products:", error);
    res.status(500).json({ message: "Failed to fetch your products" });
  }
};

// Get a single product by ID
export const getProductById = async (req, res) => {
  const { id } = req.params;
  const visitorId = req.user?.id || req.headers["x-visitor-id"] || req.ip;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ message: "Invalid or missing product ID" });
  }

  const productId = parseInt(id); // Convert string to integer

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId }, // Use parsed integer
      include: {
        images: true,
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            website: true,
            role: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (
      product.isDisabled &&
      (!req.user || (req.user.id !== product.userId && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN"))
    ) {
      return res.status(404).json({ message: "Product not found" });
    }

    try {
      const existingView = await prisma.view.findFirst({
        where: {
          visitorId,
          productId: productId, // Use parsed integer
        },
      });

      if (!existingView) {
        await prisma.view.create({
          data: {
            visitorId,
            productId: productId, // Use parsed integer
          },
        });

        await prisma.product.update({
          where: { id: productId }, // Use parsed integer
          data: {
            viewCount: {
              increment: 1,
            },
          },
        });

        product.viewCount += 1;
      }
    } catch (error) {
      console.error("Error recording view:", error);
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Failed to fetch product details" });
  }
};

// Get multiple products by IDs
export const getProductsByIds = async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({ message: "Product IDs are required" });
    }

    const productIds = ids.split(",").map((id) => parseInt(id)); // Convert each ID to integer

    if (productIds.some((id) => isNaN(id))) {
      return res.status(400).json({ message: "Invalid product IDs" });
    }

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds, // Use parsed integers
        },
        isDisabled: false,
      },
      include: {
        images: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            website: true
          },
        },
      },
    });

    res.json(products);
  } catch (error) {
    console.error("Error fetching products by IDs:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};