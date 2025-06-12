import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { Toaster } from "react-hot-toast"
// import { registerServiceWorker } from "./utils/pushNotifications"
import { FavoritesProvider } from "./contexts/FavoritesContext"
import ErrorBoundary from "./components/ErrorBoundary"
import { unregister } from './serviceWorkerRegistration';

unregister();

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <FavoritesProvider>
            <App />
            <Toaster position="top-right" />
          </FavoritesProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
