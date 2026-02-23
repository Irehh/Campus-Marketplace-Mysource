import { useEffect } from "react"
import { useLocation } from "react-router-dom"

const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    // Blur any currently focused element to prevent focus-induced scrolling
    if (document.activeElement) {
      document.activeElement.blur()
    }
    
    // Scroll to top on route change
    // Use setTimeout to ensure this happens after React renders
    const scrollTimer = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto" // Use 'auto' to avoid smooth scroll behavior which can look buggy
      })
    }, 0)

    return () => clearTimeout(scrollTimer)
  }, [pathname])

  return null
}

export default ScrollToTop
