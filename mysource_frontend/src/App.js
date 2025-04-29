// "use client"

// import { useState, useEffect } from "react"
// import { Routes, Route } from "react-router-dom"
// import { GoogleOAuthProvider } from "@react-oauth/google"
// import Layout from "./components/Layout"
// import HomePage from "./pages/HomePage"
// import ProductsPage from "./pages/ProductsPage"
// import ProductDetailPage from "./pages/ProductDetailPage"
// import BusinessesPage from "./pages/BusinessesPage"
// import BusinessDetailPage from "./pages/BusinessDetailPage"
// import AddListingPage from "./pages/AddListingPage"
// import SearchPage from "./pages/SearchPage"
// import LoginPage from "./pages/LoginPage"
// import RegisterPage from "./pages/RegisterPage"
// import ProfilePage from "./pages/ProfilePage"
// import MessagesPage from "./pages/MessagesPage"
// import ConversationPage from "./pages/ConversationPage"
// import ProtectedRoute from "./components/ProtectedRoute"
// import NotFoundPage from "./pages/NotFoundPage"
// import RequiredCampusSelection from "./components/RequiredCampusSelection"
// import { useAuth } from "./contexts/AuthContext"
// import UserDashboardPage from "./pages/UserDashboardPage"
// import ForgotPasswordPage from "./pages/ForgotPasswordPage"
// import ResetPasswordPage from "./pages/ResetPasswordPage"
// import VerifyEmailPage from "./pages/VerifyEmailPage"
// import ResendVerificationPage from "./pages/ResendVerificationPage"
// import EditProductPage from "./pages/UserDashboard/EditProductPage"
// import EditBusinessPage from "./pages/UserDashboard/EditBusinessPage"
// import OfflineIndicator from "./components/OfflineIndicator"
// import NotificationSettingsPage from "./pages/NotificationSettingsPage"
// import FavoritesPage from "./pages/FavoritesPage"
// import AdminDashboard from "./pages/admin/AdminDashboard"
// import AdminUsers from "./pages/admin/AdminUsers"
// import AdminProducts from "./pages/admin/AdminProducts"
// import AdminBusinesses from "./pages/admin/AdminBusinesses"
// import AdminRoute from "./components/AdminRoute"
// import ErrorBoundary from "./components/ErrorBoundary"

// function App() {
//   const { user, isAuthenticated } = useAuth()
//   const [showCampusSelection, setShowCampusSelection] = useState(false)
//   const [installPrompt, setInstallPrompt] = useState(null)
//   const [showInstallBanner, setShowInstallBanner] = useState(false)

//   // Check if user needs to select a campus
//   useEffect(() => {
//     if (isAuthenticated && user) {
//       if (user.needsCampusSelection || user.campus === "default") {
//         setShowCampusSelection(true)
//       } else {
//         setShowCampusSelection(false)
//       }
//     }
//   }, [isAuthenticated, user])

//   // Handle PWA install prompt
//   useEffect(() => {
//     const handleBeforeInstallPrompt = (e) => {
//       // Prevent Chrome 76+ from automatically showing the prompt
//       e.preventDefault()
//       // Stash the event so it can be triggered later
//       setInstallPrompt(e)
//       // Show install banner if user hasn't dismissed it before
//       const hasUserDismissedInstall = localStorage.getItem("dismissedInstall")
//       if (!hasUserDismissedInstall) {
//         setShowInstallBanner(true)
//       }
//     }

//     window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

//     return () => {
//       window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
//     }
//   }, [])

//   // Handle install banner
//   const handleInstall = () => {
//     if (installPrompt) {
//       // Show the install prompt
//       installPrompt.prompt()

//       // Wait for the user to respond to the prompt
//       installPrompt.userChoice.then((choiceResult) => {
//         if (choiceResult.outcome === "accepted") {
//           console.log("User accepted the install prompt")
//         } else {
//           console.log("User dismissed the install prompt")
//         }
//         // Clear the saved prompt since it can't be used again
//         setInstallPrompt(null)
//         setShowInstallBanner(false)
//       })
//     }
//   }

//   const dismissInstallBanner = () => {
//     setShowInstallBanner(false)
//     localStorage.setItem("dismissedInstall", "true")
//   }

//   return (
//     <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
//       <ErrorBoundary>
//         {showCampusSelection && <RequiredCampusSelection onComplete={() => setShowCampusSelection(false)} />}

//         {/* PWA Install Banner */}
//         {showInstallBanner && (
//           <div className="fixed bottom-0 left-0 right-0 bg-primary text-white p-3 flex justify-between items-center z-50">
//             <div>
//               <p className="font-medium">Install Campus Marketplace</p>
//               <p className="text-xs">Add to your home screen for a better experience</p>
//             </div>
//             <div className="flex space-x-2">
//               <button
//                 onClick={dismissInstallBanner}
//                 className="px-3 py-1 text-xs bg-transparent border border-white rounded-md"
//               >
//                 Not now
//               </button>
//               <button
//                 onClick={handleInstall}
//                 className="px-3 py-1 text-xs bg-white text-primary font-medium rounded-md"
//               >
//                 Install
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Offline Indicator */}
//         <OfflineIndicator />

//         <Routes>
//           <Route path="/" element={<Layout />}>
//             <Route index element={<HomePage />} />
//             <Route path="products" element={<ProductsPage />} />
//             <Route path="products/:id" element={<ProductDetailPage />} />
//             <Route path="businesses" element={<BusinessesPage />} />
//             <Route path="businesses/:id" element={<BusinessDetailPage />} />
//             <Route path="search" element={<SearchPage />} />
//             <Route path="login" element={<LoginPage />} />
//             <Route path="register" element={<RegisterPage />} />
//             <Route path="forgot-password" element={<ForgotPasswordPage />} />
//             <Route path="reset-password/:token" element={<ResetPasswordPage />} />
//             <Route path="verify-email/:token" element={<VerifyEmailPage />} />
//             <Route path="resend-verification" element={<ResendVerificationPage />} />

//             {/* Protected Routes */}
//             <Route element={<ProtectedRoute />}>
//               <Route path="add-listing" element={<AddListingPage />} />
//               <Route path="profile" element={<ProfilePage />} />
//               <Route path="messages" element={<MessagesPage />} />
//               <Route path="messages/:userId" element={<ConversationPage />} />
//               <Route path="dashboard" element={<UserDashboardPage />} />
//               <Route path="notification-settings" element={<NotificationSettingsPage />} />
//               <Route path="edit-product/:id" element={<EditProductPage />} />
//               <Route path="edit-business/:id" element={<EditBusinessPage />} />
//               <Route path="favorites" element={<FavoritesPage />} />
//             </Route>

//             {/* Admin Routes */}
//             <Route element={<AdminRoute />}>
//               <Route path="admin/dashboard" element={<AdminDashboard />} />
//               <Route path="admin/users" element={<AdminUsers />} />
//               <Route path="admin/products" element={<AdminProducts />} />
//               <Route path="admin/businesses" element={<AdminBusinesses />} />
//             </Route>

//             <Route path="*" element={<NotFoundPage />} />
//           </Route>
//         </Routes>
//       </ErrorBoundary>
//     </GoogleOAuthProvider>
//   )
// }

// export default App


"use client"

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
import AdminRoute from "./components/AdminRoute"
import ErrorBoundary from "./components/ErrorBoundary"

function App() {
  const { user, isAuthenticated } = useAuth()
  const [showCampusSelection, setShowCampusSelection] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

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

  // Handle PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later
      setInstallPrompt(e)
      // Show install banner if user hasn't dismissed it before
      const hasUserDismissedInstall = localStorage.getItem("dismissedInstall")
      if (!hasUserDismissedInstall) {
        setShowInstallBanner(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  // Handle install banner
  const handleInstall = () => {
    if (installPrompt) {
      // Show the install prompt
      installPrompt.prompt()

      // Wait for the user to respond to the prompt
      installPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt")
        } else {
          console.log("User dismissed the install prompt")
        }
        // Clear the saved prompt since it can't be used again
        setInstallPrompt(null)
        setShowInstallBanner(false)
      })
    }
  }

  const dismissInstallBanner = () => {
    setShowInstallBanner(false)
    localStorage.setItem("dismissedInstall", "true")
  }

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <ErrorBoundary>
        {showCampusSelection && <RequiredCampusSelection onComplete={() => setShowCampusSelection(false)} />}

        {/* PWA Install Banner */}
        {showInstallBanner && (
          <div className="fixed bottom-0 left-0 right-0 bg-primary text-white p-3 flex justify-between items-center z-50">
            <div>
              <p className="font-medium">Install Campus Marketplace</p>
              <p className="text-xs">Add to your home screen for a better experience</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={dismissInstallBanner}
                className="px-3 py-1 text-xs bg-transparent border border-white rounded-md"
              >
                Not now
              </button>
              <button
                onClick={handleInstall}
                className="px-3 py-1 text-xs bg-white text-primary font-medium rounded-md"
              >
                Install
              </button>
            </div>
          </div>
        )}

        {/* Offline Indicator */}
        <OfflineIndicator />

        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="businesses" element={<BusinessesPage />} />
            <Route path="businesses/:id" element={<BusinessDetailPage />} />
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
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="admin/dashboard" element={<AdminDashboard />} />
              <Route path="admin/users" element={<AdminUsers />} />
              <Route path="admin/products" element={<AdminProducts />} />
              <Route path="admin/businesses" element={<AdminBusinesses />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  )
}

export default App
