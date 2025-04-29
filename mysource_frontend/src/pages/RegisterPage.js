"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"
import toast from "react-hot-toast"
import GoogleLogin from "../components/GoogleLogin"
import Turnstile from "../components/Turnstile"

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState(null)
  const [turnstileError, setTurnstileError] = useState(null)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid"

    if (!formData.password) newErrors.password = "Password is required"
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters"

    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match"

    if (!turnstileToken) newErrors.turnstile = "Please complete the security check"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        turnstileToken: turnstileToken,
      })

      // Show success message
      setRegistrationSuccess(true)
      toast.success("Registration successful! Please check your email to verify your account.")

      // Clear form
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      })
      setTurnstileToken(null)
    } catch (error) {
      console.error("Registration error:", error)
      const errorMessage = error.response?.data?.message || "Registration failed. Please try again."
      toast.error(errorMessage)

      // Set specific field errors if returned from the server
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      }

      // If turnstile validation failed, reset it
      if (error.response?.data?.turnstileError) {
        window.turnstile?.reset()
        setTurnstileToken(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleTurnstileVerify = (token) => {
    setTurnstileToken(token)
    setTurnstileError(null)
    // Clear error if it exists
    if (errors.turnstile) {
      setErrors({
        ...errors,
        turnstile: "",
      })
    }
  }

  const handleTurnstileError = (error) => {
    setTurnstileError(error)
    setTurnstileToken(null)
  }

  const handleTurnstileExpire = () => {
    setTurnstileToken(null)
    setTurnstileError("Verification expired. Please try again.")
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Create an Account</h1>

      {registrationSuccess ? (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md">
          <h3 className="font-bold text-lg mb-2">Registration Successful!</h3>
          <p className="mb-3">
            We've sent a verification email to <strong>{formData.email}</strong>. Please check your inbox and click the
            verification link to activate your account.
          </p>
          <p className="mb-3">
            If you don't see the email, please check your spam folder or request a new verification link.
          </p>
          <div className="mt-4 flex flex-col space-y-2">
            <Link to="/login" className="btn btn-primary w-full">
              Go to Login
            </Link>
            <Link to="/resend-verification" className="btn btn-outline w-full">
              Resend Verification Email
            </Link>
          </div>
        </div>
      ) : (
        <>
          <GoogleLogin buttonText="Sign up with Google" />

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="label">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input ${errors.name ? "border-red-500" : ""}`}
                disabled={loading}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input ${errors.email ? "border-red-500" : ""}`}
                disabled={loading}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input ${errors.password ? "border-red-500" : ""}`}
                disabled={loading}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`input ${errors.confirmPassword ? "border-red-500" : ""}`}
                disabled={loading}
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            <div className="mt-4">
              <Turnstile
                onVerify={handleTurnstileVerify}
                onError={handleTurnstileError}
                onExpire={handleTurnstileExpire}
                theme="light"
                action="register"
                className="flex justify-center"
              />
              {errors.turnstile && <p className="text-red-500 text-sm mt-1 text-center">{errors.turnstile}</p>}
              {turnstileError && <p className="text-red-500 text-sm mt-1 text-center">{turnstileError}</p>}
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <p className="mt-4 text-center">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          </form>
        </>
      )}
    </div>
  )
}

export default RegisterPage
