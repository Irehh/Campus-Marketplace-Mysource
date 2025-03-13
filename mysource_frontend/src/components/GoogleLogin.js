"use client"
import { useGoogleLogin } from "@react-oauth/google"
import { useAuth } from "../contexts/AuthContext"
import { FcGoogle } from "react-icons/fc"

const GoogleLogin = () => {
  const { googleLogin } = useAuth()

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        await googleLogin(response.access_token)
      } catch (error) {
        console.error("Error during Google login:", error)
      }
    },
    onError: (error) => console.error("Google Login Error:", error),
  })

  return (
    <button onClick={() => login()} className="btn btn-outline flex items-center justify-center w-full">
      <FcGoogle className="mr-2" size={20} />
      Sign in with Google
    </button>
  )
}

export default GoogleLogin

