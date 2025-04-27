// API URL
export const REACT_APP_API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"

// Format options
export const CURRENCY_FORMAT = {
  style: "currency",
  currency: "NGN",
}

// Campus options
export const CAMPUSES = [
  { value: "unn", label: "University of Nigeria, Nsukka" },
  { value: "unizik", label: "Nnamdi Azikiwe University, Awka" },
  { value: "unical", label: "University of Calabar" },
  { value: "unilag", label: "University of Lagos" },
  { value: "futo", label: "Federal University of Technology, Owerri" },
  { value: "funaab", label: "Federal University of Agriculture, Abeokuta" },
]

// Product categories
export const PRODUCT_CATEGORIES = [
  { value: "electronics", label: "Electronics" },
  { value: "books", label: "Books" },
  { value: "lodges", label: "Lodges" },
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

