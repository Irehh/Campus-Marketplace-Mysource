import { EventEmitter } from "events"

// Create a global event emitter for server-sent events
const eventEmitter = new EventEmitter()

// Store recent events to send to new clients
const recentEvents = []
const MAX_STORED_EVENTS = 5

// SSE endpoint
export const eventsHandler = (req, res) => {
  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.setHeader("Access-Control-Allow-Origin", "*")

  // Send initial connection established message
  res.write(`data: ${JSON.stringify({ message: "Connection established" })}\n\n`)

  // Send recent events to new clients
  recentEvents.forEach((event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  })

  // Function to send events to client
  const sendEvent = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  // Listen for events
  eventEmitter.on("newProduct", sendEvent)
  eventEmitter.on("newBusiness", sendEvent)
  eventEmitter.on("newMessage", sendEvent)

  // Keep connection alive with a ping every 30 seconds
  const pingInterval = setInterval(() => {
    res.write(`: ping\n\n`)
  }, 30000)

  // Clean up on client disconnect
  req.on("close", () => {
    clearInterval(pingInterval)
    eventEmitter.off("newProduct", sendEvent)
    eventEmitter.off("newBusiness", sendEvent)
    eventEmitter.off("newMessage", sendEvent)
  })
}

// Export the event emitter for use in other controllers
export { eventEmitter }

