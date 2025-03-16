"use client"
import { useGoogleLogin } from "@react-oauth/google"
import { useAuth } from "../contexts/AuthContext"
import { FcGoogle } from "react-icons/fc"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

const GoogleLogin = () => {
  const { googleLogin } = useAuth()
  const navigate = useNavigate()

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // We're getting an access token from Google OAuth
        // This is what we need to send to our backend
        const result = await googleLogin(tokenResponse.access_token)

        // If this is a new user, they'll be prompted to select campus
        // Otherwise, they'll be redirected to home
        navigate("/")

        if (result.isNewUser) {
          toast.success("Account created successfully! Please select your campus.")
        } else {
          toast.success("Logged in successfully!")
        }
      } catch (error) {
        console.error("Error during Google login:", error)
        toast.error("Google login failed. Please try again.")
      }
    },
    onError: (error) => {
      console.error("Google Login Error:", error)
      toast.error("Google login failed. Please try again.")
    },
    flow: "implicit", // Use implicit flow to get access token directly
  })

  return (
    <button onClick={() => login()} className="btn btn-outline flex items-center justify-center w-full">
      <FcGoogle className="mr-2" size={20} />
      Continue with Google
    </button>
  )
}

export default GoogleLogin

