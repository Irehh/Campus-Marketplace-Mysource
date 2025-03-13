import { eventEmitter } from "../controllers/eventsController.js"

// Function to emit events and store them
export const emitEvent = (eventName, data) => {
  // Store recent events for new clients
  const recentEvents = []
  const MAX_STORED_EVENTS = 5

  // Store event for new clients
  recentEvents.push(data)
  if (recentEvents.length > MAX_STORED_EVENTS) {
    recentEvents.shift() // Remove oldest event
  }

  // Emit event to connected clients
  eventEmitter.emit(eventName, data)
  console.log(`Event emitted: ${eventName}`, data)
}

