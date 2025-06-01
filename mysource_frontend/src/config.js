export const REACT_APP_API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"

// Format options
export const CURRENCY_FORMAT = {
  style: "currency",
  currency: "NGN",
}

// Campus options
export const CAMPUSES = [
  { value: "unilag", label: "University of Lagos" },
  { value: "uniben", label: "University of Benin" },
  { value: "ui", label: "University of Ibadan" },
  { value: "oau", label: "Obafemi Awolowo University" },
  { value: "uniport", label: "University of Port Harcourt" },
]

// Product categories
export const PRODUCT_CATEGORIES = [
  { value: "electronics", label: "Electronics" },
  { value: "books", label: "Books" },
  { value: "clothing", label: "Clothing" },
  { value: "furniture", label: "Furniture" },
  { value: "other", label: "Other" },
]

// Business categories
export const BUSINESS_CATEGORIES = [
  { value: "food", label: "Food & Beverages" },
  { value: "retail", label: "Retail" },
  { value: "services", label: "Services" },
  { value: "tech", label: "Technology" },
  { value: "other", label: "Other" },
]

// Social Media Links by Campus
export const SOCIAL_MEDIA_LINKS = {
  // Default links (used when no campus is selected)
  default: {
    whatsapp: "https://chat.whatsapp.com/JKgCBGv5TLt9jyFgCkzRQM",
    telegram: "https://t.me/campusmarketplace",
    twitter: "https://twitter.com/campusmarketplace",
    instagram: "https://instagram.com/campusmarketplace",
  },
  // Campus-specific links
  unilag: {
    whatsapp: "https://chat.whatsapp.com/JKgCBGv5TLt9jyFgCkzRQM",
    telegram: "https://t.me/unilagmarketplace",
  },
  uniben: {
    whatsapp: "https://chat.whatsapp.com/KLgCBGv5TLt9jyFgCkzRQM",
    telegram: "https://t.me/unibenmarketplace",
  },
  ui: {
    whatsapp: "https://chat.whatsapp.com/LKgCBGv5TLt9jyFgCkzRQM",
    telegram: "https://t.me/uimarketplace",
  },
  oau: {
    whatsapp: "https://chat.whatsapp.com/MKgCBGv5TLt9jyFgCkzRQM",
    telegram: "https://t.me/oaumarketplace",
  },
  uniport: {
    whatsapp: "https://chat.whatsapp.com/NKgCBGv5TLt9jyFgCkzRQM",
    telegram: "https://t.me/uniportmarketplace",
  },
}

// Gig categories
export const GIG_CATEGORIES = [
  { value: "design", label: "Design & Creative" },
  { value: "development", label: "Web Development" },
  { value: "writing", label: "Writing & Translation" },
  { value: "marketing", label: "Digital Marketing" },
  { value: "video", label: "Video & Animation" },
  { value: "music", label: "Music & Audio" },
  { value: "business", label: "Business" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "education", label: "Education & Training" },
  { value: "other", label: "Other" },
]

// Transaction types
export const TRANSACTION_TYPES = [
  { value: "all", label: "All Transactions" },
  { value: "deposit", label: "Deposits" },
  { value: "withdrawal", label: "Withdrawals" },
  { value: "escrow", label: "Escrow" },
  { value: "release", label: "Payments" },
  { value: "refund", label: "Refunds" },
  { value: "fee", label: "Fees" },
]

// Transaction statuses
export const TRANSACTION_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
]

// Wallet constants
export const WALLET_CONSTANTS = {
  MINIMUM_WITHDRAWAL: 1000,
  WITHDRAWAL_FEE: 200,
  MINIMUM_DEPOSIT: 100,
}
