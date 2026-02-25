export const REACT_APP_API_URL = process.env.REACT_APP_API_URL || "https://mysource.com.ng"

// Format options
export const CURRENCY_FORMAT = {
  style: "currency",
  currency: "NGN",
}

// Campus options
export const CAMPUSES = [
  { value: "unn", label: "University of Nigeria, Nsukka" },
  { value: "uniben", label: "University of Benin" },
  { value: "ui", label: "University of Ibadan" },
  { value: "unilag", label: "University of Lagos" },
  { value: "oau", label: "Obafemi Awolowo University" },
  { value: "abu", label: "Ahmadu Bello University" },
  { value: "unilorin", label: "University of Ilorin" },
  { value: "unijos", label: "University of Jos" },
  { value: "uniport", label: "University of Port Harcourt" },
  { value: "funaab", label: "Federal University of Agriculture, Abeokuta" },
  { value: "unical", label: "University of Calabar" },
  { value: "futa", label: "Federal University of Technology, Akure" },
  { value: "futminna", label: "Federal University of Technology, Minna" },
  { value: "uniuyo", label: "University of Uyo" },
  { value: "bayero", label: "Bayero University, Kano" },
  { value: "lautech", label: "Ladoke Akintola University of Technology" },
  { value: "unimaid", label: "University of Maiduguri" },
  { value: "usmanu", label: "Usmanu Danfodiyo University" },
  { value: "futo", label: "Federal University of Technology, Owerri" },
  { value: "unizik", label: "Nnamdi Azikiwe University" },
  { value: "uniabuja", label: "University of Abuja" },
  { value: "ebu", label: "Edo State University" }
]

// Product categories
export const PRODUCT_CATEGORIES = [
  { value: "electronics", label: "Electronics" },
  { value: "lodges", label: "Lodges & Accomodations" },
  { value: "clothing", label: "Clothing" },
  { value: "furniture", label: "Furniture" },
  { value: "other", label: "Other" },
  { value: "books", label: "Books & Stationery" },
  { value: "vehicles", label: "Vehicles" },
  { value: "services", label: "Services" },
  { value: "food", label: "Food & Beverages" },
  { value: "tech", label: "Technology & Gadgets" },
  { value: "fashion", label: "Fashion & Clothing" },
  { value: "health", label: "Health & Wellness" },
  { value: "education", label: "Education & Training" },
  { value: "entertainment", label: "Entertainment" },
  { value: "finance", label: "Finance & Consulting" },
  { value: "realestate", label: "Real Estate" },
  { value: "homeandproperties", label: "Home & Properties" },
]

// Business categories
export const BUSINESS_CATEGORIES = [
  { value: "food", label: "Food & Beverages" },
  { value: "retail", label: "Retail" },
  { value: "services", label: "Services" },
  { value: "tech", label: "Technology" },
  { value: "other", label: "Other" },
  { value: "homeandproperties", label: "Home & Properties" },
  { value: "fashion", label: "Fashion & Clothing" },
  { value: "health", label: "Health & Wellness" },
  { value: "education", label: "Education & Training" },
  { value: "entertainment", label: "Entertainment" },
  { value: "finance", label: "Finance & Consulting" },
  { value: "realestate", label: "Real Estate" }
]

// Social Media Links by Campus
export const SOCIAL_MEDIA_LINKS = {
  // Default links (used when no campus is selected)
  default: {
    whatsapp: "https://wa.me/2348075889260",
    telegram: "https://t.me/+GwOjGSPTticwNTM0",
    twitter: "https://x.com/mysource_ng",
    facebook: "https://web.facebook.com/groups/745670956863374",
    instagram: "https://instagram.com/mysource_ng",
  },
  // Campus-specific links
  unn: {
    whatsapp: "https://wa.me/2348075889260",
    telegram: "https://t.me/+GwOjGSPTticwNTM0",
  },
  uniben: {
    whatsapp: "https://wa.me/2348075889260",
    telegram: "https://t.me/+GwOjGSPTticwNTM0",
  },
  uniport: {
    whatsapp: "https://wa.me/2348075889260",
    telegram: "https://t.me/+GwOjGSPTticwNTM0",
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
