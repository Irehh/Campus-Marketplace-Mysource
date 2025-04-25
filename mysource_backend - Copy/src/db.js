import { PrismaClient } from "@prisma/client"

// Create a single instance of PrismaClient
const prisma = new PrismaClient({
  log: ["error", "warn"],
})

export default prisma

