import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import ProductCard from "../components/ProductCard";
import BusinessCard from "../components/BusinessCard";
import {
  FiSearch,
  FiShoppingBag,
  FiGrid,
  FiDollarSign,
  FiUsers,
  FiEye,
  FiShield,
  FiTrendingUp,
  FiMessageCircle,
  FiArrowRight,
} from "react-icons/fi";
import { BsTelegram } from "react-icons/bs";
import { FaWhatsapp } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { useCacheUpdateListener } from "../utils/cacheUpdateListener";
import { formatCurrency } from "../utils/format";
import { SOCIAL_MEDIA_LINKS, CAMPUSES } from "../config";

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userCampus, setUserCampus] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const campus = isAuthenticated
        ? user.campus
        : Cookies.get("userCampus") || "";
      setUserCampus(campus);

      const [productsRes, businessesRes, gigsRes] = await Promise.all([
        axios.get(`/api/products?campus=${campus}&limit=4`),
        axios.get(`/api/businesses?campus=${campus}&limit=3`),
        axios.get(`/api/gigs?campus=${campus}&limit=4`),
      ]);

      setProducts(productsRes.data.products);
      setBusinesses(businessesRes.data.businesses);
      setGigs(gigsRes.data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useCacheUpdateListener("homepage-products", () => {
    console.log("Products updated in cache, refreshing...");
    fetchData();
  });

  useCacheUpdateListener("homepage-businesses", () => {
    console.log("Businesses updated in cache, refreshing...");
    fetchData();
  });

  useCacheUpdateListener("homepage-gigs", () => {
    console.log("Gigs updated in cache, refreshing...");
    fetchData();
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const campus = userCampus || "";
  // Use default social links when no campus is selected, otherwise merge campus-specific with default
  const socialLinks =
    campus && SOCIAL_MEDIA_LINKS[campus]
      ? { ...SOCIAL_MEDIA_LINKS.default, ...SOCIAL_MEDIA_LINKS[campus] }
      : SOCIAL_MEDIA_LINKS.default;

  // Get campus label, fallback to "Campus" if no campus
  const campusLabel = campus
    ? CAMPUSES.find((c) => c.value === campus)?.label || campus.toUpperCase()
    : "Campus";

  const marketplaceName = campus
    ? `${campusLabel} Marketplace`
    : "Campus Marketplace";
  const communityName = campus
    ? `${campusLabel} Communities`
    : "Campus Communities";
  const connectText = campus
    ? `Connect with ${campusLabel} students`
    : "Connect with campus students";
  const ctaText = campus
    ? `Join ${campusLabel} students buying, selling, and connecting on ${marketplaceName}`
    : "Join students buying, selling, and connecting on Campus Marketplace";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-700 to-primary-900 text-white rounded-lg p-4 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {marketplaceName}
        </h1>
        <p className="text-sm mb-4 max-w-2xl mx-auto">
          Find products, services, and gigs on your campus. {connectText}.
        </p>
        <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search products, services, or gigs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/70"
          />
          <FiSearch
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70"
            size={20}
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white text-primary-700 rounded-full p-1"
          >
            <FiSearch size={18} />
          </button>
        </form>
      </section>

      {/* How It Works Section */}
      <section className="bg-green-50 rounded-lg p-4 flex flex-col items-center">
        <h2 className="text-xl font-bold text-center mb-4 text-green-800">
          How It Works
        </h2>
        <div className="grid grid-cols-3 gap-3 w-full max-w-4xl">
          <div className="flex flex-col items-center text-center">
            <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center mb-2">
              <span className="text-green-600 font-bold">1</span>
            </div>
            <h4 className="text-sm font-semibold mb-1 text-green-800">
              Browse or List
            </h4>
            <p className="text-xs text-gray-600">
              Find or list items/services.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-teal-100 w-10 h-10 rounded-full flex items-center justify-center mb-2">
              <span className="text-teal-600 font-bold">2</span>
            </div>
            <h4 className="text-sm font-semibold mb-1 text-green-800">
              Connect
            </h4>
            <p className="text-xs text-gray-600">Message sellers or buyers.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-lime-100 w-10 h-10 rounded-full flex items-center justify-center mb-2">
              <span className="text-lime-600 font-bold">3</span>
            </div>
            <h4 className="text-sm font-semibold mb-1 text-green-800">
              Complete
            </h4>
            <p className="text-xs text-gray-600">Meet safely to transact.</p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold flex items-center">
            <FiShoppingBag className="mr-2" /> Products
          </h2>
          <div className="flex items-center gap-2">
            {refreshing && (
              <span className="text-xs text-secondary-500 flex items-center">
                <div className="animate-spin h-3 w-3 border-t-2 border-b-2 border-primary-700 rounded-full mr-1"></div>
                Updating...
              </span>
            )}
            <Link
              to="/products"
              className="text-primary-700 hover:underline text-xs"
            >
              View all
            </Link>
          </div>
        </div>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-secondary-50 rounded-lg">
            <p className="text-secondary-600 text-sm">No products found.</p>
            <Link
              to="/add-listing"
              className="text-primary-700 hover:underline mt-1 inline-block text-xs"
            >
              Be the first to add a product!
            </Link>
          </div>
        )}
      </section>

      {/* Featured Businesses */}
      <section>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold flex items-center">
            <FiGrid className="mr-2" /> Campus Businesses
          </h2>
          <div className="flex items-center gap-2">
            {refreshing && (
              <span className="text-xs text-secondary-500 flex items-center">
                <div className="animate-spin h-3 w-3 border-t-2 border-b-2 border-primary-700 rounded-full mr-1"></div>
                Updating...
              </span>
            )}
            <Link
              to="/businesses"
              className="text-primary-700 hover:underline text-xs"
            >
              View all
            </Link>
          </div>
        </div>
        {businesses.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-secondary-50 rounded-lg">
            <p className="text-secondary-600 text-sm">No businesses found.</p>
            <Link
              to="/add-listing"
              className="text-primary-700 hover:underline mt-1 inline-block text-xs"
            >
              Be the first to add a business!
            </Link>
          </div>
        )}
      </section>

      {/* Featured Gigs */}
      <section>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold flex items-center">
            <FiDollarSign className="mr-2" /> Campus Gigs
          </h2>
          <div className="flex items-center gap-2">
            {refreshing && (
              <span className="text-xs text-secondary-500 flex items-center">
                <div className="animate-spin h-3 w-3 border-t-2 border-b-2 border-primary-700 rounded-full mr-1"></div>
                Updating...
              </span>
            )}
            <Link
              to="/gigs"
              className="text-primary-700 hover:underline text-xs"
            >
              View all
            </Link>
          </div>
        </div>
        {gigs && gigs.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {gigs.map((gig) => (
              <Link
                key={gig.id}
                to={`/gigs/${gig.id}`}
                className="block bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {gig.description
                      ? gig.description.substring(0, 50) + "..."
                      : "Gig"}
                  </h3>
                  <p className="text-sm font-medium text-primary-700 mt-1">
                    {formatCurrency(gig.budget)}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                      {gig.category}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 flex items-center">
                        <FiEye className="mr-1" size={10} />
                        {gig.views || 0}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <FiUsers className="mr-1" size={10} />
                        {gig.bidCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-secondary-50 rounded-lg">
            <p className="text-secondary-600 text-sm">No gigs found.</p>
            <Link
              to="/gigs/create"
              className="text-primary-700 hover:underline mt-1 inline-block text-xs"
            >
              Be the first to post a gig!
            </Link>
          </div>
        )}
      </section>

      {/* Community Section */}
      <section className="bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg p-3 relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
          <img
            src="1.jpg" // Path to your image
            alt="Community Image"
            className="w-full h-full object-cover object-top scale-125"
          />
        </div>
        <div
          className="relative z-10 flex flex-col items-center justify-center h-full"
          style={{
            maskImage: "linear-gradient(to right, white 70%, transparent 100%)",
          }}
        >
          <div className="flex items-center">
            <BsTelegram size={32} className="mr-3" />
            <FaWhatsapp size={32} className="mr-3" />
            <h2 className="text-2xl font-bold">Join Our {communityName}!</h2>
          </div>
          <p className="text-lg mt-2 mb-3">
            Connect on Telegram and WhatsApp for updates, deals, and campus
            vibes.
          </p>
          <div className="flex space-x-3">
            <a
              href={socialLinks.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-blue-500 px-5 py-1.5 rounded-full text-base font-medium hover:bg-blue-50"
            >
              Join Telegram
            </a>
            <a
              href={socialLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-green-500 px-5 py-1.5 rounded-full text-base font-medium hover:bg-green-50"
            >
              Join WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-bold text-center mb-4">
          Why Choose {marketplaceName}?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center">
            <FiShield className="mx-auto text-green-500 mb-2" size={20} />
            <h4 className="text-sm font-semibold mb-1">Safe & Secure</h4>
            <p className="text-xs text-gray-600">
              Verified users and secure messaging.
            </p>
          </div>
          <div className="text-center">
            <FiUsers className="mx-auto text-blue-500 mb-2" size={20} />
            <h4 className="text-sm font-semibold mb-1">
              {campus ? `${campusLabel} Community` : "Campus Community"}
            </h4>
            <p className="text-xs text-gray-600">{connectText}.</p>
          </div>
          <div className="text-center">
            <FiTrendingUp className="mx-auto text-yellow-500 mb-2" size={20} />
            <h4 className="text-sm font-semibold mb-1">Best Prices</h4>
            <p className="text-xs text-gray-600">Student-friendly deals.</p>
          </div>
          <div className="text-center">
            <FiMessageCircle
              className="mx-auto text-orange-500 mb-2"
              size={20}
            />
            <h4 className="text-sm font-semibold mb-1">Easy Communication</h4>
            <p className="text-xs text-gray-600">Built-in messaging system.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary-700 text-white rounded-lg p-4 text-center">
        <h2 className="text-lg font-bold mb-1">Ready to Get Started?</h2>
        <p className="mb-3 text-gray-300 text-sm">{ctaText}</p>
        <Link
          to="/add-listing"
          className="inline-block bg-white text-primary-700 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-gray-100"
        >
          Start Selling
        </Link>
      </section>
    </div>
  );
};

export default HomePage;
