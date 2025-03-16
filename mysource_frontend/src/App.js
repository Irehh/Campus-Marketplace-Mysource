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

function App() {
  const { user, isAuthenticated } = useAuth()
  const [showCampusSelection, setShowCampusSelection] = useState(false)

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

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      {showCampusSelection && <RequiredCampusSelection onComplete={() => setShowCampusSelection(false)} />}

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

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="add-listing" element={<AddListingPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="messages/:userId" element={<ConversationPage />} />
            <Route path="dashboard" element={<UserDashboardPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </GoogleOAuthProvider>
  )
}

export default App

