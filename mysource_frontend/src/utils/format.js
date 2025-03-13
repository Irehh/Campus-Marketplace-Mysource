import { CURRENCY_FORMAT } from "../config"

// Format currency
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "Price on request"

  return new Intl.NumberFormat("en-NG", CURRENCY_FORMAT).format(amount)
}

// Format date
export const formatDate = (dateString) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

