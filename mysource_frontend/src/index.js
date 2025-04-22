
import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { Toaster } from "react-hot-toast"
import { registerServiceWorker } from "./utils/pushNotifications"
import { FavoritesProvider } from "./contexts/FavoritesContext"

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    registerServiceWorker().catch((error) => {
      console.error("Service worker registration failed:", error)
    })
  })
}

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
          <App />
          <Toaster position="top-right" />
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)