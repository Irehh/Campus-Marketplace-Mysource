import { useState, useEffect } from "react"
import { Routes, Route } from "react-router-dom"
import { GoogleOAuthProvider } from "@react-oauth/google"
import Layout from "./components/Layout"
import HomePage from "./pages/HomePage"
import ProductsPage from "./pages/ProductsPage"
import ProductDetailPage from "./pages/ProductDetailPage"
import BusinessesPage from "./pages/BusinessesPage"
import BusinessDetailPage from "./pages/BusinessDetailPage"
import AddListingPage from "./pages/AddListingPage"
import SearchPage from "./pages/SearchPage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import ProfilePage from "./pages/ProfilePage"
import MessagesPage from "./pages/MessagesPage"
import ConversationPage from "./pages/ConversationPage"
import ProtectedRoute from "./components/ProtectedRoute"
import NotFoundPage from "./pages/NotFoundPage"
import RequiredCampusSelection from "./components/RequiredCampusSelection"
import { useAuth } from "./contexts/AuthContext"
import UserDashboardPage from "./pages/UserDashboardPage"
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import ResetPasswordPage from "./pages/ResetPasswordPage"
import VerifyEmailPage from "./pages/VerifyEmailPage"
import ResendVerificationPage from "./pages/ResendVerificationPage"
import EditProductPage from "./pages/UserDashboard/EditProductPage"
import EditBusinessPage from "./pages/UserDashboard/EditBusinessPage"
import OfflineIndicator from "./components/OfflineIndicator"
import NotificationSettingsPage from "./pages/NotificationSettingsPage"
import FavoritesPage from "./pages/FavoritesPage"
import AboutPage from "./pages/AboutPage"
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage"
import TermsPage from "./pages/TermsPage"
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminUsers from "./pages/admin/AdminUsers"
import AdminProducts from "./pages/admin/AdminProducts"
import AdminBusinesses from "./pages/admin/AdminBusinesses"
import AdminFeeSettings from "./pages/admin/AdminFeeSettings"
import AdminRoute from "./components/AdminRoute"
import ErrorBoundary from "./components/ErrorBoundary"
import { clearApiCaches, checkForNewVersion } from "./utils/cacheBuster"
import DevTools from "./components/DevTools"
import PWAUpdatePrompt from "./components/PWAUpdatePrompt"
import useServiceWorkerUpdate from "./hooks/useServiceWorkerUpdate"
import GigsPage from "./pages/GigsPage"
import GigDetailPage from "./pages/GigDetailPage"
import CreateGigPage from "./pages/CreateGigPage"
import EditGigPage from "./pages/EditGigPage"
import WalletPage from "./pages/WalletPage"
import TransactionsPage from "./pages/TransactionsPage"
import DepositPage from "./pages/DepositPage"
import WithdrawPage from "./pages/WithdrawPage"
import VerifyPaymentPage from "./pages/VerifyPaymentPage"
import MyBidsPage from "./pages/MyBidsPage"
import CartPage from "./pages/CartPage"
import OrdersPage from "./pages/OrdersPage"
import OrderDetailPage from "./pages/OrderDetailPage"
import SellerOrdersPage from "./pages/SellerOrdersPage"

function App() {
  const { user, isAuthenticated } = useAuth()
  const [showCampusSelection, setShowCampusSelection] = useState(false)

  // PWA Update Hook
  const {
    updateAvailable,
    isMandatory,
    newVersion,
    updateNow,
    dismiss,
  } = useServiceWorkerUpdate()

  //Clear API caches on app start
  useEffect(() => {
    clearApiCaches()
    console.log("API caches cleared on app start")
  }, [])

  // Check for new version
  useEffect(() => {
    checkForNewVersion((oldVersion, newVersion) => {
      console.log(`App updated from ${oldVersion} to ${newVersion}`)
    })
  }, [])

  // Check if user needs to select a campus
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.needsCampusSelection || user.campus === "default") {
        setShowCampusSelection(true)
      } else {
        setShowCampusSelection(false)
      }
    }
  }, [isAuthenticated, user])

  const handleUpdate = () => {
    // Clear API caches and reload
    clearApiCaches().then(() => {
      window.location.reload(true)
    })
  }

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <ErrorBoundary>
        {showCampusSelection && <RequiredCampusSelection onComplete={() => setShowCampusSelection(false)} />}
        
        {/* PWA Update Prompt - Mandatory or Optional */}
        <PWAUpdatePrompt
          updateAvailable={updateAvailable}
          isMandatory={isMandatory}
          newVersion={newVersion}
          onUpdate={updateNow}
          onDismiss={dismiss}
        />
        
        {/* Offline Indicator */}
        <OfflineIndicator />

        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="businesses" element={<BusinessesPage />} />
            <Route path="businesses/:id" element={<BusinessDetailPage />} />
            <Route path="gigs" element={<GigsPage />} />
            <Route path="gigs/:id" element={<GigDetailPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="verify-email/:token" element={<VerifyEmailPage />} />
            <Route path="resend-verification" element={<ResendVerificationPage />} />

            {/* Legal Pages */}
            <Route path="about" element={<AboutPage />} />
            <Route path="privacy" element={<PrivacyPolicyPage />} />
            <Route path="terms" element={<TermsPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="add-listing" element={<AddListingPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="messages/:userId" element={<ConversationPage />} />
              <Route path="dashboard" element={<UserDashboardPage />} />
              <Route path="notification-settings" element={<NotificationSettingsPage />} />
              <Route path="edit-product/:id" element={<EditProductPage />} />
              <Route path="edit-business/:id" element={<EditBusinessPage />} />
              <Route path="favorites" element={<FavoritesPage />} />
              <Route path="gigs/create" element={<CreateGigPage />} />
              <Route path="gigs/:id/edit" element={<EditGigPage />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="wallet/deposit" element={<DepositPage />} />
              <Route path="wallet/withdraw" element={<WithdrawPage />} />
              <Route path="wallet/verify-payment" element={<VerifyPaymentPage />} />
              <Route path="my-bids" element={<MyBidsPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:orderId" element={<OrderDetailPage />} />
              <Route path="seller-orders" element={<SellerOrdersPage />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="admin/dashboard" element={<AdminDashboard />} />
              <Route path="admin/users" element={<AdminUsers />} />
              <Route path="admin/products" element={<AdminProducts />} />
              <Route path="admin/businesses" element={<AdminBusinesses />} />
              <Route path="admin/fee-settings" element={<AdminFeeSettings />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ErrorBoundary>
      {/* Development Tools */}
      <DevTools />
    </GoogleOAuthProvider>
  )
}

export default App
