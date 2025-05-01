// API URL
export const REACT_APP_API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"


// Format options
export const CURRENCY_FORMAT = {
  style: "currency",
  currency: "NGN",
}

// Campus options
export const CAMPUSES = [
  { value: "unilag", label: "University of Lagos" },
  { value: "unn", label: "University of Nigeria, Nsukka" },
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
  },
  // Campus-specific links
  unilag: {
    whatsapp: "https://chat.whatsapp.com/JKgCBGv5TLt9jyFgCkzRQM",
    telegram: "https://t.me/unilagmarketplace",
  },
  unn: {
    whatsapp: "https://chat.whatsapp.com/",
    telegram: "https://t.me/+JtybfwFqQT0wMDI0",
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
