// "use client";

// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { apiPost, apiGet } from "../utils/api";
// import { formatCurrency } from "../utils/format";
// import { useAuth } from "../contexts/AuthContext";
// import MessageForm from "../components/MessageForm";
// import SuggestedProducts from "../components/SuggestedProducts";
// import {
//   FiMessageSquare,
//   FiMapPin,
//   FiLink,
//   FiPhone,
//   FiClock,
//   FiMessageCircle,
//   FiEye,
//   FiAlertTriangle,
//   FiShield,
//   FiHeart,
//   FiShoppingCart,
// } from "react-icons/fi";
// import { BsTelegram } from "react-icons/bs";
// import { formatDistanceToNow } from "date-fns";
// import CommentSection from "../components/CommentSection";
// import toast from "react-hot-toast";
// import { useFavorites } from "../contexts/FavoritesContext";
// import { SOCIAL_MEDIA_LINKS } from "../config";

// const ProductDetailPage = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { user, isAuthenticated, token } = useAuth();
//   const { isFavorite, toggleFavorite } = useFavorites();
//   const [product, setProduct] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [selectedImage, setSelectedImage] = useState(0);
//   const [showMessageForm, setShowMessageForm] = useState(false);
//   const [showComments, setShowComments] = useState(false);
//   const [telegramChannel, setTelegramChannel] = useState("");
//   const [disableReason, setDisableReason] = useState("");
//   const [showDisableForm, setShowDisableForm] = useState(false);
//   const [campusAdmin, setCampusAdmin] = useState(null);
//   const [addingToCart, setAddingToCart] = useState(false);
//   const [buyingNow, setBuyingNow] = useState(false);

//   const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
//   const isFav = isFavorite(id, "product");

//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         const visitorId = user?.id || sessionStorage.getItem("visitorId") || Math.random().toString(36).substring(2, 15);
//         if (!user?.id && !sessionStorage.getItem("visitorId")) {
//           sessionStorage.setItem("visitorId", visitorId);
//         }

//         const headers = {};
//         if (!user?.id) {
//           headers["x-visitor-id"] = visitorId;
//         }

//         const response = await apiGet(`/api/products/${id}`, { headers });
//         setProduct(response.data);

//         const campus = response.data.campus;
//         const campusLinks = SOCIAL_MEDIA_LINKS[campus] || SOCIAL_MEDIA_LINKS.default;
//         if (campusLinks.telegram) {
//           const channelName = campusLinks.telegram.split("/").pop().replace("+", "");
//           setTelegramChannel(channelName);
//         }
//       } catch (error) {
//         console.error("Error fetching product:", error);
//         if (error.response?.status === 404) {
//           toast.error("Product not found or has been removed");
//           navigate("/products");
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProduct();
//   }, [id, user, navigate]);

//   useEffect(() => {
//     const fetchCampusAdmin = async () => {
//       if (!product?.campus) return;

//       try {
//         const headers = token ? { Authorization: `Bearer ${token}` } : {};
//         const response = await apiGet(`/api/admin/campus-admin/${product.campus}`, { headers });

//         if (response.data && response.data.website) {
//           setCampusAdmin(response.data);
//         }
//       } catch (error) {
//         console.error("Error fetching campus admin:", error);
//       }
//     };

//     if (product) {
//       fetchCampusAdmin();
//     }
//   }, [product, token]);

//   const joinTelegramChannel = () => {
//     if (telegramChannel) {
//       window.open(`https://t.me/${telegramChannel}`, "_blank");
//     }
//   };

//   const handleDisableProduct = async () => {
//     if (!disableReason.trim()) {
//       toast.error("Please provide a reason for disabling this product");
//       return;
//     }

//     try {
//       await apiPost(`/api/admin/products/${id}/disable`, { reason: disableReason });
//       toast.success("Product has been disabled");
//       setProduct((prev) => ({ ...prev, isDisabled: true, disabledReason: disableReason }));
//       setShowDisableForm(false);
//       setDisableReason("");
//     } catch (error) {
//       console.error("Error disabling product:", error);
//       toast.error("Failed to disable product");
//     }
//   };

//   const handleEnableProduct = async () => {
//     try {
//       await apiPost(`/api/admin/products/${id}/enable`, {});
//       toast.success("Product has been enabled");
//       setProduct((prev) => ({ ...prev, isDisabled: false, disabledReason: null }));
//     } catch (error) {
//       console.error("Error enabling product:", error);
//       toast.error("Failed to enable product");
//     }
//   };

//   const handleToggleFavorite = async () => {
//     if (!isAuthenticated) {
//       navigate("/login");
//       return;
//     }

//     await toggleFavorite(id, "product");
//   };

//   const handleAddToCart = async () => {
//     if (!isAuthenticated) {
//       navigate("/login");
//       return;
//     }

//     setAddingToCart(true);
//     try {
//       await apiPost("/api/cart/add", {
//         productId: product.id,
//         quantity: 1,
//       });

//       toast.success("Product added to cart!");
//       window.dispatchEvent(new Event("cartUpdated"));
//     } catch (error) {
//       console.error("Error adding to cart:", error);
//       if (error.response?.status === 400) {
//         toast.error(error.response.data.message || "Cannot add this product to cart");
//       } else {
//         toast.error("Failed to add product to cart");
//       }
//     } finally {
//       setAddingToCart(false);
//     }
//   };

//   const handleBuyNow = async () => {
//     if (!isAuthenticated) {
//       navigate("/login");
//       return;
//     }

//     setBuyingNow(true);
//     try {
//       const response = await apiPost("/api/orders/buy-now", {
//         productId: product.id,
//         quantity: 1,
//         deliveryMethod: "pickup",
//         notes: "Buy Now purchase from detail page",
//       });

//       toast.success(`Order #${response.data.order.orderNumber} created successfully!`);
//       navigate("/orders");
//     } catch (error) {
//       console.error("Error buying now:", error);
//       if (error.response?.status === 400) {
//         toast.error(error.response.data.message || "Cannot purchase this product");
//         if (error.response.data.message.includes("Insufficient")) {
//           setTimeout(() => navigate("/wallet/deposit"), 2500);
//         }
//       } else {
//         toast.error("Failed to process purchase");
//       }
//     } finally {
//       setBuyingNow(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00b53f]"></div>
//       </div>
//     );
//   }

//   if (!product) {
//     return <div className="text-center py-4">Product not found</div>;
//   }

//   const isOwner = user && product.userId === user.id;
//   const timeAgo = formatDistanceToNow(new Date(product.createdAt), { addSuffix: true });

//   return (
//     <div className="container mx-auto px-2 py-2 max-w-4xl">
//       {product.isDisabled && (
//         <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-md">
//           <div className="flex items-start">
//             <FiAlertTriangle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
//             <div>
//               <p className="font-medium text-red-700">This product has been disabled</p>
//               {product.disabledReason && <p className="text-sm text-red-600 mt-1">Reason: {product.disabledReason}</p>}
//               <p className="text-sm text-red-600 mt-1">
//                 {isOwner
//                   ? "Only you can see this product. Contact an admin if you believe this is a mistake."
//                   : "This product is not visible to other users."}
//               </p>
//               {isOwner && (
//                 <p className="text-sm mt-2">
//                   <a href="mailto:admin@campusmarketplace.com" className="text-[#00b53f] hover:underline">
//                     Contact Admin
//                   </a>
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
//         <div>
//           {product.Images && product.Images.length > 0 ? (
//             <div className="grid grid-cols-1 gap-2">
//               <div className="w-full h-[166px] overflow-hidden rounded-lg bg-gray-100 relative">
//                 <img
//                   src={product.Images[selectedImage].url || "/images/placeholder.png"}
//                   alt={product.description}
//                   className="w-full h-full object-contain"
//                 />
//                 <button
//                   onClick={handleToggleFavorite}
//                   className={`absolute top-2 right-2 z-10 rounded-full flex items-center justify-center 
//                     ${isFav ? "bg-red-500 text-white" : "bg-white text-gray-600"} 
//                     w-8 h-8 hover:scale-110 transition-all duration-200 shadow-md`}
//                   aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
//                 >
//                   <FiHeart className={isFav ? "fill-current" : ""} />
//                 </button>
//               </div>
//               <div className="grid grid-cols-4 gap-1">
//                 {product.Images.map((image, index) => (
//                   <img
//                     key={image.id}
//                     src={image.thumbnailUrl || "/images/placeholder.png"}
//                     alt={`Thumbnail ${index + 1}`}
//                     className={`w-[55px] h-[55px] object-cover rounded cursor-pointer ${selectedImage === index ? "border-2 border-[#00b53f]" : ""}`}
//                     onClick={() => setSelectedImage(index)}
//                   />
//                 ))}
//               </div>
//             </div>
//           ) : (
//             <div className="w-full h-[166px] bg-gray-200 rounded-lg flex items-center justify-center relative">
//               <p>No image available</p>
//               <button
//                 onClick={handleToggleFavorite}
//                 className={`absolute top-2 right-2 z-10 rounded-full flex items-center justify-center 
//                   ${isFav ? "bg-red-500 text-white" : "bg-white text-gray-600"} 
//                   w-8 h-8 hover:scale-110 transition-all duration-200 shadow-md`}
//                 aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
//               >
//                 <FiHeart className={isFav ? "fill-current" : ""} />
//               </button>
//             </div>
//           )}
//         </div>

//         <div>
//           <div className="flex justify-between items-start">
//             <h1 className="text-lg font-bold">{product.description.split("\n")[0]}</h1>
//             <p className="text-base font-bold text-[#00b53f]">{formatCurrency(product.price)}</p>
//           </div>

//           <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
//             <div className="flex items-center">
//               <FiClock className="mr-1" size={12} />
//               <span>{timeAgo}</span>
//             </div>
//             <div className="flex items-center">
//               <FiEye className="mr-1" size={12} />
//               <span>{product.viewCount || 0} views</span>
//             </div>
//           </div>

//           <div className="mt-1 mb-2 flex flex-wrap gap-1 items-center">
//             <span className="inline-block bg-gray-200 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-700">
//               {product.category || "Uncategorized"}
//             </span>
//             <span className="inline-block bg-gray-200 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-700 flex items-center">
//               <FiMapPin size={10} className="mr-1" /> {product.campus}
//             </span>
//             {product.platformPurchaseEnabled && (
//               <span className="inline-block bg-green-200 rounded-full px-2 py-0.5 text-xs font-semibold text-green-700">
//                 Online Purchase Available
//               </span>
//             )}
//             {product.platformPurchaseEnabled && !isOwner && !product.isDisabled && (
//               <button
//                 onClick={handleBuyNow}
//                 disabled={buyingNow || addingToCart}
//                 className="ml-auto px-2 py-0.5 bg-[#00b53f] text-white rounded-full text-xs hover:bg-[#009f36] disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {buyingNow ? (
//                   <>
//                     <div className="animate-spin inline-block rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
//                     Processing...
//                   </>
//                 ) : (
//                   "Buy Now"
//                 )}
//               </button>
//             )}
//           </div>

//           <div className="border-t border-gray-200 pt-2 mt-2">
//             <h2 className="text-xs font-semibold mb-1">Description</h2>
//             <p className="text-xs whitespace-pre-line max-h-[60px] overflow-y-auto">{product.description}</p>
//           </div>

//           {(product.User?.phone || product.User?.website) && (
//             <div className="mt-2 space-y-1">
//               {product.User.website && (
//                 <a
//                   href={
//                     product.User.website.startsWith("http") ? product.User.website : `https://${product.User.website}`
//                   }
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="flex items-center text-xs text-[#00b53f] hover:underline"
//                 >
//                   <FiLink size={12} className="mr-1" />
//                   {product.User.website}
//                 </a>
//               )}
//               {product.User.phone && (
//                 <a
//                   href={`tel:${product.User.phone}`}
//                   className="flex items-center text-xs text-[#00b53f] hover:underline"
//                 >
//                   <FiPhone size={12} className="mr-1" />
//                   {product.User.phone}
//                 </a>
//               )}
//             </div>
//           )}

//           <div className="border-t border-gray-200 pt-2 mt-2">
//             <div className="flex justify-between items-center">
//               <h2 className="text-xs font-semibold">Seller</h2>
//               <span className="text-xs">{product.User?.name || "Anonymous"}</span>
//             </div>
//           </div>

//           {product.platformPurchaseEnabled && !isOwner && !product.isDisabled && (
//             <div className="border-t border-gray-200 pt-2 mt-2">
//               <div className="flex gap-2 mb-2">
//                 <button
//                   onClick={handleAddToCart}
//                   disabled={addingToCart || buyingNow}
//                   className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded-md text-xs hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   <FiShoppingCart className="mr-1" size={12} />
//                   {addingToCart ? "Adding..." : "Add to Cart"}
//                 </button>
//               </div>
//             </div>
//           )}

//           <div className="flex flex-wrap mt-2 gap-2">
//             {!isOwner && !product.isDisabled && (
//               <button
//                 onClick={() => setShowMessageForm(!showMessageForm)}
//                 className="flex items-center px-3 py-1 bg-[#00b53f] text-white rounded-md text-xs hover:bg-[#009f36]"
//               >
//                 <FiMessageSquare className="mr-1" size={12} />
//                 Contact Seller
//               </button>
//             )}

//             {campusAdmin && campusAdmin.website && (
//               <a
//                 href={campusAdmin.website.startsWith("http") ? campusAdmin.website : `https://${campusAdmin.website}`}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700"
//               >
//                 <FiAlertTriangle className="mr-1" size={12} />
//                 Contact Admin
//               </a>
//             )}

//             <button
//               onClick={joinTelegramChannel}
//               className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600"
//             >
//               <BsTelegram className="mr-1" size={12} />
//               Join {product.campus} Telegram
//             </button>

//             <button
//               onClick={() => setShowComments(!showComments)}
//               className="flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-xs hover:bg-gray-300"
//             >
//               <FiMessageCircle className="mr-1" size={12} />
//               {showComments ? "Hide Comments" : "Show Comments"}
//             </button>

//             {isAdmin && !product.isDisabled && (
//               <button
//                 onClick={() => setShowDisableForm(!showDisableForm)}
//                 className="flex items-center px-3 py-1 bg-red-500 text-white rounded-md text-xs hover:bg-red-600"
//               >
//                 <FiShield className="mr-1" size={12} />
//                 Disable Product
//               </button>
//             )}

//             {isAdmin && product.isDisabled && (
//               <button
//                 onClick={handleEnableProduct}
//                 className="flex items-center px-3 py-1 bg-green-500 text-white rounded-md text-xs hover:bg-green-600"
//               >
//                 <FiShield className="mr-1" size={12} />
//                 Enable Product
//               </button>
//             )}
//           </div>

//           {showDisableForm && (
//             <div className="mt-3 p-3 border border-red-200 rounded-md bg-red-50">
//               <h3 className="text-sm font-medium text-red-700 mb-2">Disable Product</h3>
//               <textarea
//                 value={disableReason}
//                 onChange={(e) => setDisableReason(e.target.value)}
//                 placeholder="Reason for disabling this product..."
//                 className="w-full px-3 py-2 text-xs border border-red-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
//                 rows="2"
//               ></textarea>
//               <div className="flex justify-end mt-2 space-x-2">
//                 <button
//                   onClick={() => setShowDisableForm(false)}
//                   className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-100"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleDisableProduct}
//                   className="px-3 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600"
//                 >
//                   Disable
//                 </button>
//               </div>
//             </div>
//           )}

//           {showMessageForm && !isOwner && !product.isDisabled && (
//             <div className="mt-2">
//               <MessageForm
//                 receiverId={product.userId}
//                 productId={product.id}
//                 onMessageSent={() => setShowMessageForm(false)}
//               />
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="mt-4 border-t border-gray-200 pt-2">
//         <h2 className="text-base font-semibold mb-1">You might also like</h2>
//         <SuggestedProducts currentProductId={product.id} category={product.category} campus={product.campus} />
//       </div>

//       {showComments && (
//         <div className="mt-4 border-t border-gray-200 pt-2">
//           <CommentSection itemId={product.id} itemType="product" />
//         </div>
//       )}
//     </div>
//   );
// };

// export default ProductDetailPage;


"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api"; // Use api.js with axios
import { formatCurrency } from "../utils/format";
import { useAuth } from "../contexts/AuthContext";
import MessageForm from "../components/MessageForm";
import SuggestedProducts from "../components/SuggestedProducts";
import {
  FiMessageSquare,
  FiMapPin,
  FiLink,
  FiPhone,
  FiClock,
  FiMessageCircle,
  FiEye,
  FiAlertTriangle,
  FiShield,
  FiHeart,
  FiShoppingCart,
} from "react-icons/fi";
import { BsTelegram, BsWhatsapp } from "react-icons/bs"; // Add WhatsApp icon
import { formatDistanceToNow } from "date-fns";
import CommentSection from "../components/CommentSection";
import toast from "react-hot-toast";
import { useFavorites } from "../contexts/FavoritesContext";
import { SOCIAL_MEDIA_LINKS } from "../config";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [telegramChannel, setTelegramChannel] = useState("");
  const [whatsappGroup, setWhatsappGroup] = useState(""); // Add WhatsApp state
  const [disableReason, setDisableReason] = useState("");
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [campusAdmin, setCampusAdmin] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isFav = isFavorite(id, "product");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const visitorId = user?.id || sessionStorage.getItem("visitorId") || Math.random().toString(36).substring(2, 15);
        if (!user?.id && !sessionStorage.getItem("visitorId")) {
          sessionStorage.setItem("visitorId", visitorId);
        }

        const headers = {};
        if (!user?.id) {
          headers["x-visitor-id"] = visitorId;
        }

        const response = await api.get(`/api/products/${id}`, { headers });
        console.log("Product API Response:", response.data); // Debug
        setProduct(response.data);

        const campus = response.data.campus;
        const campusLinks = SOCIAL_MEDIA_LINKS[campus] || SOCIAL_MEDIA_LINKS.default;
        if (campusLinks.telegram) {
          const channelName = campusLinks.telegram.split("/").pop().replace("+", "");
          setTelegramChannel(channelName);
        }
        if (campusLinks.whatsapp) {
          setWhatsappGroup(campusLinks.whatsapp); // Set WhatsApp link
        }
      } catch (error) {
        console.error("Error fetching product:", error.response?.data || error.message);
        if (error.response?.status === 404) {
          toast.error("Product not found or has been removed");
          navigate("/products");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, user, navigate]);

  useEffect(() => {
    const fetchCampusAdmin = async () => {
      if (!product?.campus) return;

      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await api.get(`/api/admin/campus-admin/${product.campus}`, { headers });
        console.log("Campus Admin API Response:", response.data); // Debug
        if (response.data && response.data.website) {
          setCampusAdmin(response.data);
        }
      } catch (error) {
        console.error("Error fetching campus admin:", error.response?.data || error.message);
      }
    };

    if (product) {
      fetchCampusAdmin();
      console.log("Debug Buy Now Conditions:", {
        platformPurchaseEnabled: product.platformPurchaseEnabled,
        isOwner: user && product.userId === user.id,
        isDisabled: product.isDisabled,
        userId: user?.id,
        productUserId: product.userId,
        hasUser: !!product.User,
      });
    }
  }, [product, token, user]);

  const joinTelegramChannel = () => {
    if (telegramChannel) {
      window.open(`https://t.me/${telegramChannel}`, "_blank");
    }
  };

  const joinWhatsappGroup = () => {
    if (whatsappGroup) {
      window.open(whatsappGroup, "_blank"); // Open WhatsApp link
    }
  };

  const handleDisableProduct = async () => {
    if (!disableReason.trim()) {
      toast.error("Please provide a reason for disabling this product");
      return;
    }

    try {
      const response = await api.post(`/api/admin/products/${id}/disable`, { reason: disableReason });
      console.log("Disable Product Response:", response.data); // Debug
      toast.success("Product has been disabled");
      setProduct((prev) => ({ ...prev, isDisabled: true, disabledReason: disableReason }));
      setShowDisableForm(false);
      setDisableReason("");
    } catch (error) {
      console.error("Error disabling product:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to disable product");
    }
  };

  const handleEnableProduct = async () => {
    try {
      const response = await api.post(`/api/admin/products/${id}/enable`, {});
      console.log("Enable Product Response:", response.data); // Debug
      toast.success("Product has been enabled");
      setProduct((prev) => ({ ...prev, isDisabled: false, disabledReason: null }));
    } catch (error) {
      console.error("Error enabling product:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to enable product");
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    await toggleFavorite(id, "product");
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setAddingToCart(true);
    try {
      const response = await api.post("/api/cart/add", {
        productId: product.id,
        quantity: 1,
      });
      console.log("Add to Cart Response:", response.data); // Debug
      toast.success("Product added to cart!");
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error("Error adding to cart:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to add product to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setBuyingNow(true);
    try {
      const response = await api.post("/api/orders/buy-now", {
        productId: product.id,
        quantity: 1,
        deliveryMethod: "pickup",
        notes: "Buy Now purchase from detail page",
      });
      console.log("Buy Now Response:", response.data); // Debug
      toast.success(`Order #${response.data.order.orderNumber} created successfully!`);
      navigate("/orders");
    } catch (error) {
      console.error("Error buying now:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || "Cannot purchase this product";
      toast.error(errorMessage);
      if (errorMessage.includes("Insufficient")) {
        setTimeout(() => navigate("/wallet/deposit"), 2500);
      }
    } finally {
      setBuyingNow(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00b53f]"></div>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-4">Product not found</div>;
  }

  const isOwner = user && product.userId === user.id;
  const timeAgo = formatDistanceToNow(new Date(product.createdAt), { addSuffix: true });

  return (
    <div className="container mx-auto px-2 py-2 max-w-4xl">
      {product.isDisabled && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-md">
          <div className="flex items-start">
            <FiAlertTriangle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-700">This product has been disabled</p>
              {product.disabledReason && <p className="text-sm text-red-600 mt-1">Reason: {product.disabledReason}</p>}
              <p className="text-sm text-red-600 mt-1">
                {isOwner
                  ? "Only you can see this product. Contact an admin if you believe this is a mistake."
                  : "This product is not visible to other users."}
              </p>
              {isOwner && (
                <p className="text-sm mt-2">
                  <a href="mailto:admin@campusmarketplace.com" className="text-[#00b53f] hover:underline">
                    Contact Admin
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          {product.Images && product.Images.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              <div className="w-full h-[166px] overflow-hidden rounded-lg bg-gray-100 relative">
                <img
                  src={product.Images[selectedImage].url || "/images/placeholder.png"}
                  alt={product.description}
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={handleToggleFavorite}
                  className={`absolute top-2 right-2 z-10 rounded-full flex items-center justify-center 
                    ${isFav ? "bg-red-500 text-white" : "bg-white text-gray-600"} 
                    w-8 h-8 hover:scale-110 transition-all duration-200 shadow-md`}
                  aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                >
                  <FiHeart className={isFav ? "fill-current" : ""} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {product.Images.map((image, index) => (
                  <img
                    key={image.id}
                    src={image.thumbnailUrl || "/images/placeholder.png"}
                    alt={`Thumbnail ${index + 1}`}
                    className={`w-[55px] h-[55px] object-cover rounded cursor-pointer ${selectedImage === index ? "border-2 border-[#00b53f]" : ""}`}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full h-[166px] bg-gray-200 rounded-lg flex items-center justify-center relative">
              <p>No image available</p>
              <button
                onClick={handleToggleFavorite}
                className={`absolute top-2 right-2 z-10 rounded-full flex items-center justify-center 
                  ${isFav ? "bg-red-500 text-white" : "bg-white text-gray-600"} 
                  w-8 h-8 hover:scale-110 transition-all duration-200 shadow-md`}
                aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
              >
                <FiHeart className={isFav ? "fill-current" : ""} />
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-start">
            <h1 className="text-lg font-bold">{product.description.split("\n")[0]}</h1>
            <p className="text-base font-bold text-[#00b53f]">{formatCurrency(product.price)}</p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
            <div className="flex items-center">
              <FiClock className="mr-1" size={12} />
              <span>{timeAgo}</span>
            </div>
            <div className="flex items-center">
              <FiEye className="mr-1" size={12} />
              <span>{product.viewCount || 0} views</span>
            </div>
          </div>

          <div className="mt-1 mb-2 flex flex-wrap gap-1 items-center">
            <span className="inline-block bg-gray-200 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-700">
              {product.category || "Uncategorized"}
            </span>
            <span className="inline-block bg-gray-200 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-700 flex items-center">
              <FiMapPin size={10} className="mr-1" /> {product.campus}
            </span>
            {product.platformPurchaseEnabled && (
              <span className="inline-block bg-green-200 rounded-full px-2 py-0.5 text-xs font-semibold text-green-700">
                Online Purchase Available
              </span>
            )}
          </div>

          <div className="border-t border-gray-200 pt-2 mt-2">
            <h2 className="text-xs font-semibold mb-1">Description</h2>
            <p className="text-xs whitespace-pre-line max-h-[60px] overflow-y-auto">{product.description}</p>
          </div>

          {(product.User?.phone || product.User?.website) && (
            <div className="mt-2 space-y-1">
              {product.User.website && (
                <a
                  href={
                    product.User.website.startsWith("http") ? product.User.website : `https://${product.User.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-xs text-[#00b53f] hover:underline"
                >
                  <FiLink size={12} className="mr-1" />
                  {product.User.website}
                </a>
              )}
              {product.User.phone && (
                <a
                  href={`tel:${product.User.phone}`}
                  className="flex items-center text-xs text-[#00b53f] hover:underline"
                >
                  <FiPhone size={12} className="mr-1" />
                  {product.User.phone}
                </a>
              )}
            </div>
          )}

          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-semibold">Seller</h2>
              <span className="text-xs">{product.User?.name || "Anonymous"}</span>
            </div>
          </div>

          {product.platformPurchaseEnabled && !isOwner && !product.isDisabled && (
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || buyingNow}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded-md text-xs hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiShoppingCart className="mr-1" size={12} />
                  {addingToCart ? "Adding..." : "Add to Cart"}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={buyingNow || addingToCart}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-[#00b53f] text-white rounded-md text-xs hover:bg-[#009f36] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {buyingNow ? (
                    <>
                      <div className="animate-spin inline-block rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                      Processing...
                    </>
                  ) : (
                    "Buy Now"
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap mt-2 gap-2">
            {!isOwner && !product.isDisabled && (
              <button
                onClick={() => setShowMessageForm(!showMessageForm)}
                className="flex items-center px-2 py-1 bg-gray-600 text-white rounded-md text-xs hover:bg-gray-700"
              >
                <FiMessageSquare className="mr-1" size={10} />
                Contact
              </button>
            )}

            {campusAdmin && campusAdmin.website && (
              <a
                href={campusAdmin.website.startsWith("http") ? campusAdmin.website : `https://${campusAdmin.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-2 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700"
              >
                <FiAlertTriangle className="mr-1" size={10} />
                Contact Admin
              </a>
            )}

            <button
              onClick={joinTelegramChannel}
              className="flex items-center px-2 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600"
            >
              <BsTelegram className="mr-1" size={10} />
              Telegram
            </button>

            <button
              onClick={joinWhatsappGroup}
              className="flex items-center px-2 py-1 bg-green-500 text-white rounded-md text-xs hover:bg-green-600"
            >
              <BsWhatsapp className="mr-1" size={10} />
              WhatsApp
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center px-2 py-1 bg-gray-200 text-gray-600 rounded-md text-xs hover:bg-gray-300"
            >
              <FiMessageCircle className="mr-1" size={10} />
              {showComments ? "Hide" : "Comments"}
            </button>

            {isAdmin && !product.isDisabled && (
              <button
                onClick={() => setShowDisableForm(true)}
                className="flex items-center px-2 py-1 bg-red-500 text-white rounded-md text-xs hover:bg-red-600"
              >
                <FiShield className="mr-1" size={10} />
                Disable
              </button>
            )}

            {isAdmin && product.isDisabled && (
              <button
                onClick={handleEnableProduct}
                className="flex items-center px-2 py-1 bg-green-500 text-white rounded-md text-xs hover:bg-green-600"
              >
                <FiShield className="mr-1" size={10} />
                Enable
              </button>
            )}
          </div>

          {showDisableForm && (
            <div className="mt-2 p-2 border border-red-200 rounded-md bg-gray-50">
              <h3 className="text-xs font-semibold text-red-600 mb-1">Disable Product</h3>
              <textarea
                value={disableReason}
                onChange={(e) => setDisableReason(e.target.value)}
                placeholder="Reason for disabling..."
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
                rows="2"
              ></textarea>
              <div className="flex justify-end mt-1 gap-1">
                <button
                  onClick={() => setShowDisableForm(false)}
                  className="px-2 py-1 text-xs text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisableProduct}
                  className="px-2 py-1 text-xs text-white bg-red-500 rounded-md hover:bg-red-600"
                >
                  Disable
                </button>
              </div>
            </div>
          )}

          {showMessageForm && !isOwner && !product.isDisabled && (
            <div className="mt-2">
              <MessageForm
                receiverId={product.userId}
                productId={product.id}
                onMessageSent={() => setShowMessageForm(false)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-gray-200 pt-2">
        <h2 className="text-sm font-semibold mb-1">YouTube Suggestions</h2>
        <SuggestedProducts currentProductId={product.id} category={product.category} id={product.id} />
      </div>

      {showComments && (
        <div className="mt-4 border-t border-gray-200 pt-2">
          <CommentSection id={product.id} type="product" />
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;