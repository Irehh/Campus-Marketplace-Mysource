
// import React, { createContext, useState, useContext, useEffect } from "react"
// import axios from "axios"
// import { useAuth } from "./AuthContext"
// import toast from "react-hot-toast"

// const FavoritesContext = createContext()

// export const useFavorites = () => useContext(FavoritesContext)

// export const FavoritesProvider = ({ children }) => {
//   const [favorites, setFavorites] = useState([])
//   const [loading, setLoading] = useState(true)
//   const { isAuthenticated, token } = useAuth()

//   // Load favorites from API when authenticated
//   useEffect(() => {
//     const fetchFavorites = async () => {
//       if (!isAuthenticated || !token) {
//         setFavorites([])
//         setLoading(false)
//         return
//       }

//       try {
//         setLoading(true)
//         const response = await axios.get("/api/favorites", {
//           headers: { Authorization: `Bearer ${token}` },
//         })
//         setFavorites(response.data || [])
//       } catch (error) {
//         console.error("Error fetching favorites:", error)
//         setFavorites([])
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchFavorites()
//   }, [isAuthenticated, token])

//   // Check if an item is in favorites
//   const isFavorite = (itemId, itemType = "product") => {
//     const itemIdInt = parseInt(itemId, 10); // Ensure itemId is an integer
//     return favorites.some((fav) => fav.itemId === itemIdInt && fav.itemType === itemType)
//   }

//   // Add to favorites
//   const addFavorite = async (itemId, itemType = "product") => {
//     if (!isAuthenticated) {
//       toast.error("Please log in to add favorites")
//       return false
//     }

//     const itemIdInt = parseInt(itemId, 10); // Ensure itemId is an integer
//     if (isNaN(itemIdInt)) {
//       toast.error("Invalid item ID")
//       return false;
//     }

//     try {
//       const response = await axios.post(
//         "/api/favorites",
//         { itemId: itemIdInt, itemType },
//         { headers: { Authorization: `Bearer ${token}` } }
//       )
      
//       setFavorites([...favorites, response.data])
//       toast.success("Added to favorites")
//       return true
//     } catch (error) {
//       console.error("Error adding favorite:", error)
//       toast.error("Failed to add to favorites")
//       return false
//     }
//   }

//   // Remove from favorites
//   const removeFavorite = async (itemId, itemType = "product") => {
//     if (!isAuthenticated) return false

//     const itemIdInt = parseInt(itemId, 10); // Ensure itemId is an integer
//     if (isNaN(itemIdInt)) {
//       toast.error("Invalid item ID")
//       return false;
//     }

//     try {
//       await axios.delete(`/api/favorites/${itemIdInt}?itemType=${itemType}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
      
//       setFavorites(favorites.filter(fav => !(fav.itemId === itemIdInt && fav.itemType === itemType)))
//       toast.success("Removed from favorites")
//       return true
//     } catch (error) {
//       console.error("Error removing favorite:", error)
//       toast.error("Failed to remove from favorites")
//       return false
//     }
//   }

//   // Toggle favorite status
//   const toggleFavorite = async (itemId, itemType = "product") => {
//     const itemIdInt = parseInt(itemId, 10); // Ensure itemId is an integer
//     if (isNaN(itemIdInt)) {
//       toast.error("Invalid item ID")
//       return false;
//     }

//     if (isFavorite(itemIdInt, itemType)) {
//       return removeFavorite(itemIdInt, itemType)
//     } else {
//       return addFavorite(itemIdInt, itemType)
//     }
//   }

//   return (
//     <FavoritesContext.Provider
//       value={{
//         favorites,
//         loading,
//         isFavorite,
//         addFavorite,
//         removeFavorite,
//         toggleFavorite,
//       }}
//     >
//       {children}
//     </FavoritesContext.Provider>
//   )
// }

// export default FavoritesProvider


// In FavoritesContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const FavoritesContext = createContext();

export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, token } = useAuth();

  // Load favorites from API when authenticated
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isAuthenticated || !token) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get("/api/favorites", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Use response.data.favorites to get the array of favorite records
        setFavorites(response.data.favorites || []);
      } catch (error) {
        console.error("Error fetching favorites:", error);
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [isAuthenticated, token]);

  // Check if an item is in favorites
  const isFavorite = (itemId, itemType = "product") => {
    const itemIdInt = parseInt(itemId, 10); // Ensure itemId is an integer
    return favorites.some((fav) => fav.itemId === itemIdInt && fav.itemType === itemType);
  };

  // Add to favorites
  const addFavorite = async (itemId, itemType = "product") => {
    if (!isAuthenticated) {
      toast.error("Please log in to add favorites");
      return false;
    }

    const itemIdInt = parseInt(itemId, 10); // Ensure itemId is an integer
    if (isNaN(itemIdInt)) {
      toast.error("Invalid item ID");
      return false;
    }

    try {
      const response = await axios.post(
        "/api/favorites",
        { itemId: itemIdInt, itemType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFavorites([...favorites, response.data]);
      toast.success("Added to favorites");
      return true;
    } catch (error) {
      console.error("Error adding favorite:", error);
      toast.error("Failed to add to favorites");
      return false;
    }
  };

  // Remove from favorites
  const removeFavorite = async (itemId, itemType = "product") => {
    if (!isAuthenticated) return false;

    const itemIdInt = parseInt(itemId, 10); // Ensure itemId is an integer
    if (isNaN(itemIdInt)) {
      toast.error("Invalid item ID");
      return false;
    }

    try {
      await axios.delete(`/api/favorites/${itemIdInt}?itemType=${itemType}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFavorites(favorites.filter((fav) => !(fav.itemId === itemIdInt && fav.itemType === itemType)));
      toast.success("Removed from favorites");
      return true;
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("Failed to remove from favorites");
      return false;
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (itemId, itemType = "product") => {
    const itemIdInt = parseInt(itemId, 10); // Ensure itemId is an integer
    if (isNaN(itemIdInt)) {
      toast.error("Invalid item ID");
      return false;
    }

    if (isFavorite(itemIdInt, itemType)) {
      return removeFavorite(itemIdInt, itemType);
    } else {
      return addFavorite(itemIdInt, itemType);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export default FavoritesProvider;