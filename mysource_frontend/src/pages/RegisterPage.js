// RegisterPage.js


"use client"

// Update RegisterPage to remove campus selection
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import GoogleLogin from "../components/GoogleLogin"
import toast from "react-hot-toast"

const RegisterPage = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      toast.error("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      // Default campus will be set on the server or during profile completion
      await register({ name, email, password })
      toast.success("Registration successful!")
      navigate("/")
    } catch (error) {
      console.error("Registration error:", error)
      setError(error.response?.data?.message || "Failed to register. Please try again.")
      toast.error(error.response?.data?.message || "Failed to register")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="label">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
            required
            disabled={loading}
          />
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>

      <div className="mt-4">
        <GoogleLogin />
      </div>

      <p className="mt-4 text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}

export default RegisterPage


