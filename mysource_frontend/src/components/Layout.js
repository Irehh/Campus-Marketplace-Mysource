import { Outlet } from "react-router-dom"
import Navbar from "./Navbar"
import Footer from "./Footer"
import EventMarquee from "./EventMarquee"
import PwaInstallPrompt from "./PwaInstallPrompt"

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <EventMarquee />
      <div className="container mx-auto px-4 py-4 flex-grow max-w-6xl">
        <Outlet />
      </div>
      <Footer />
      <PwaInstallPrompt />
    </div>
  )
}

export default Layout

