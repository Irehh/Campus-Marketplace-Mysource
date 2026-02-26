import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { Toaster } from "react-hot-toast"
import { FavoritesProvider } from "./contexts/FavoritesContext"
import { PWAProvider } from "./contexts/PWAContext"
import ErrorBoundary from "./components/ErrorBoundary"
import { registerServiceWorker } from './serviceWorkerRegistration'

// Register the service worker
if (process.env.NODE_ENV === 'production') {
  registerServiceWorker()
}

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <PWAProvider>
            <FavoritesProvider>
              <App />
              <Toaster position="top-right" />
            </FavoritesProvider>
          </PWAProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
