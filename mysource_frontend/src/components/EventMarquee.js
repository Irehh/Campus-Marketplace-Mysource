"use client"

import { useEffect, useState } from "react"
import { API_URL } from "../config"
import { useAuth } from "../contexts/AuthContext"
import Cookies from "js-cookie"

const EventMarquee = () => {
  const [events, setEvents] = useState([])
  const { user } = useAuth()
  const [reconnectCount, setReconnectCount] = useState(0)
  const [eventSource, setEventSource] = useState(null)

  // Get user's campus (from auth or cookie)
  const userCampus = user?.campus || Cookies.get("userCampus") || ""

  // Subscribe to server-sent events
  useEffect(() => {
    // Close any existing connection
    if (eventSource) {
      eventSource.close()
    }

    // Create new connection
    const newEventSource = new EventSource(`${API_URL}/api/events`)
    setEventSource(newEventSource)

    newEventSource.onmessage = (event) => {
      try {
        const newEvent = JSON.parse(event.data)

        // Only show events relevant to user's campus or general announcements
        if (!newEvent.campus || newEvent.campus === userCampus || newEvent.campus === "all") {
          setEvents((prev) => [
            ...prev,
            {
              ...newEvent,
              id: Math.random().toString(36).substring(2, 9),
              timestamp: Date.now(),
            },
          ])
        }
      } catch (error) {
        console.error("Error parsing event data:", error)
      }
    }

    newEventSource.onerror = (error) => {
      console.error("EventSource error:", error)
      newEventSource.close()

      // Try to reconnect after 5 seconds (with exponential backoff)
      const timeout = Math.min(5000 * Math.pow(1.5, reconnectCount), 30000)
      setTimeout(() => {
        setReconnectCount((prev) => prev + 1)
      }, timeout)
    }

    // Clean up on unmount
    return () => {
      newEventSource.close()
    }
  }, [userCampus, reconnectCount])

  // Remove events after 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setEvents((prev) => prev.filter((event) => now - event.timestamp < 30000))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (events.length === 0) return null

  return (
    <div className="bg-primary-50 border-y border-primary-100 py-1 sticky top-0 z-10 w-full">
      <div className="container mx-auto max-w-6xl">
        <div className="overflow-hidden">
          <div className="whitespace-nowrap animate-marquee">
            {events.map((event) => (
              <span key={event.id} className="inline-block mx-4 text-xs text-primary-800">
                {event.message}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventMarquee

