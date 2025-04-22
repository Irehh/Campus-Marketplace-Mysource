// "use client"

// import { useState, useEffect } from "react"
// import { useFavorites } from "../contexts/FavoritesContext"
// import { useAuth } from "../contexts/AuthContext"
// import axios from "axios"
// import ProductCard from "../components/ProductCard"
// import BusinessCard from "../components/BusinessCard"
// import { FiTrash2, FiAlertCircle } from "react-icons/fi"
// import { Link } from "react-router-dom"
// import PageHeader from "../components/PageHeader"
// import EmptyState from "../components/EmptyState"
// import Loader from "../components/Loader"

// const FavoritesPage = () => {
//   const { favorites, loading: favoritesLoading, removeFavorite } = useFavorites()
//   const { token, isAuthenticated } = useAuth()
//   const [items, setItems] = useState({ products: [], businesses: [] })
//   const [loading, setLoading] = useState(true)
//   const [activeTab, setActiveTab] = useState("products")

//   useEffect(() => {
//     const fetchFavoriteItems = async () => {
//       if (!isAuthenticated || !token || favoritesLoading) {
//         return
//       }

//       setLoading(true)
//       try {
//         // Group favorites by type
//         const productFavorites = favorites.filter((fav) => fav.itemType === "product")
//         const businessFavorites = favorites.filter((fav) => fav.itemType === "business")

//         // Fetch products
//         let products = []
//         if (productFavorites.length > 0) {
//           const productIds = productFavorites.map((fav) => fav.itemId)
//           const productResponse = await axios.get(`/api/products/batch?ids=${productIds.join(",")}`, {
//             headers: { Authorization: `Bearer ${token}` },
//           })
//           products = productResponse.data || []
//         }

//         // Fetch businesses
//         let businesses = []
//         if (businessFavorites.length > 0) {
//           const businessIds = businessFavorites.map((fav) => fav.itemId)
//           const businessResponse = await axios.get(`/api/businesses/batch?ids=${businessIds.join(",")}`, {
//             headers: { Authorization: `Bearer ${token}` },
//           })
//           businesses = businessResponse.data || []
//         }

//         setItems({ products, businesses })
//       } catch (error) {
//         console.error("Error fetching favorite items:", error)
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchFavoriteItems()
//   }, [favorites, token, isAuthenticated, favoritesLoading])

//   const handleRemoveFavorite = async (itemId, itemType) => {
//     await removeFavorite(itemId, itemType)
//   }

//   if (favoritesLoading) {
//     return <Loader />
//   }

//   if (!isAuthenticated) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
//           <div className="flex">
//             <div className="flex-shrink-0">
//               <FiAlertCircle className="h-5 w-5 text-yellow-400" />
//             </div>
//             <div className="ml-3">
//               <p className="text-sm text-yellow-700">
//                 Please{" "}
//                 <Link to="/login" className="font-medium underline">
//                   log in
//                 </Link>{" "}
//                 to view your favorites.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="container mx-auto px-4 py-4 mb-16 md:mb-0">
//       <PageHeader title="My Favorites" />

//       <div className="mb-4 border-b border-gray-200">
//         <nav className="flex -mb-px">
//           <button
//             onClick={() => setActiveTab("products")}
//             className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm ${
//               activeTab === "products"
//                 ? "border-primary text-primary"
//                 : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//             }`}
//           >
//             Products
//           </button>
//           <button
//             onClick={() => setActiveTab("businesses")}
//             className={`py-2 px-1 border-b-2 font-medium text-sm ${
//               activeTab === "businesses"
//                 ? "border-primary text-primary"
//                 : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//             }`}
//           >
//             Businesses
//           </button>
//         </nav>
//       </div>

//       {loading ? (
//         <Loader />
//       ) : (
//         <>
//           {activeTab === "products" && (
//             <>
//               {items.products.length === 0 ? (
//                 <EmptyState
//                   message="You haven't added any products to your favorites yet."
//                   actionText="Browse Products"
//                   actionLink="/products"
//                 />
//               ) : (
//                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
//                   {items.products.map((product) => (
//                     <div key={product.id} className="relative">
//                       <ProductCard product={product} />
//                       <button
//                         onClick={() => handleRemoveFavorite(product.id, "product")}
//                         className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50"
//                         aria-label="Remove from favorites"
//                       >
//                         <FiTrash2 className="text-red-500" size={16} />
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </>
//           )}

//           {activeTab === "businesses" && (
//             <>
//               {items.businesses.length === 0 ? (
//                 <EmptyState
//                   message="You haven't added any businesses to your favorites yet."
//                   actionText="Browse Businesses"
//                   actionLink="/businesses"
//                 />
//               ) : (
//                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
//                   {items.businesses.map((business) => (
//                     <div key={business.id} className="relative">
//                       <BusinessCard business={business} />
//                       <button
//                         onClick={() => handleRemoveFavorite(business.id, "business")}
//                         className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50"
//                         aria-label="Remove from favorites"
//                       >
//                         <FiTrash2 className="text-red-500" size={16} />
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </>
//           )}
//         </>
//       )}
//     </div>
//   )
// }

// export default FavoritesPage


// In FavoritesPage.jsx
"use client";

import { useState, useEffect } from "react";
import { useFavorites } from "../contexts/FavoritesContext";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import ProductCard from "../components/ProductCard";
import BusinessCard from "../components/BusinessCard";
import { FiTrash2, FiAlertCircle } from "react-icons/fi";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import Loader from "../components/Loader";

const FavoritesPage = () => {
  const { loading: favoritesLoading, removeFavorite } = useFavorites();
  const { token, isAuthenticated } = useAuth();
  const [items, setItems] = useState({ products: [], businesses: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");

  useEffect(() => {
    const fetchFavoriteItems = async () => {
      if (!isAuthenticated || !token || favoritesLoading) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch favorites with associated products and businesses
        const response = await axios.get("/api/favorites", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Favorites response:", response.data); // Debug log

        setItems({
          products: response.data.products || [],
          businesses: response.data.businesses || [],
        });
      } catch (error) {
        console.error("Error fetching favorite items:", error);
        setItems({ products: [], businesses: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteItems();
  }, [token, isAuthenticated, favoritesLoading]);

  const handleRemoveFavorite = async (itemId, itemType) => {
    await removeFavorite(itemId, itemType);
  };

  if (favoritesLoading || loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Please{" "}
                <Link to="/login" className="font-medium underline">
                  log in
                </Link>{" "}
                to view your favorites.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 mb-16 md:mb-0">
      <PageHeader title="My Favorites" />

      <div className="mb-4 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab("products")}
            className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "products"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab("businesses")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "businesses"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Businesses
          </button>
        </nav>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <>
          {activeTab === "products" && (
            <>
              {items.products.length === 0 ? (
                <EmptyState
                  message="You haven't added any products to your favorites yet."
                  actionText="Browse Products"
                  actionLink="/products"
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {items.products.map((product) => (
                    <div key={product.id} className="relative">
                      <ProductCard product={product} />
                      <button
                        onClick={() => handleRemoveFavorite(product.id, "product")}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50"
                        aria-label="Remove from favorites"
                      >
                        <FiTrash2 className="text-red-500" size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "businesses" && (
            <>
              {items.businesses.length === 0 ? (
                <EmptyState
                  message="You haven't added any businesses to your favorites yet."
                  actionText="Browse Businesses"
                  actionLink="/businesses"
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {items.businesses.map((business) => (
                    <div key={business.id} className="relative">
                      <BusinessCard business={business} />
                      <button
                        onClick={() => handleRemoveFavorite(business.id, "business")}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50"
                        aria-label="Remove from favorites"
                      >
                        <FiTrash2 className="text-red-500" size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default FavoritesPage;