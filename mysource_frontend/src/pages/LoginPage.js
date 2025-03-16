"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import GoogleLogin from "../components/GoogleLogin"
import toast from "react-hot-toast"
import { FiMail, FiLock } from "react-icons/fi"

const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login({ email, password })
      navigate("/")
    } catch (error) {
      console.error("Login error:", error)
      setError(error.response?.data?.message || "Failed to log in. Please check your credentials.")
      toast.error(error.response?.data?.message || "Failed to log in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Log In</h1>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 input"
              required
              disabled={loading}
            />
            <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="label">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 input"
              required
              disabled={loading}
            />
            <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>

      <div className="mt-6 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="mt-6">
        <GoogleLogin />
      </div>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <Link to="/register" className="text-primary hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </div>
  )
}

export default LoginPage

