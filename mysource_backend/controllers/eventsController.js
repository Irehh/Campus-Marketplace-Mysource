const { EventEmitter } = require("events");

// Create a global event emitter for server-sent events
const eventEmitter = new EventEmitter();

// Store recent events to send to new clients
const recentEvents = [];
const MAX_STORED_EVENTS = 2;

// SSE endpoint
exports.eventsHandler = (req, res) => {
  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Send initial connection established message

  // res.write(`data: ${JSON.stringify({ message: 'Try our Telegram Bot 🤖' })}\n\n`);

  res.write(
    `data: ${JSON.stringify({
      message: "Hey there! All the basics are up and running 💯",
    })}\n\n`
  );
  res.write(
    `data: ${JSON.stringify({
      message:
        "We’re working hard behind the scenes to make this better for you 😌",
    })}\n\n`
  );
  res.write(
    `data: ${JSON.stringify({
      message: "Updates are coming every day — thanks for sticking with us 🙏",
    })}\n\n`
  );
  res.write(
    `data: ${JSON.stringify({
      message:
        "Want to see what we’re up to or share your thoughts? Join our community on social media! 🤝",
    })}\n\n`
  );

  // Send recent events to new clients
  recentEvents.forEach((event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  // Function to send events to client
  const sendEvent = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
    // Store recent events
    recentEvents.push(event);
    if (recentEvents.length > MAX_STORED_EVENTS) {
      recentEvents.shift();
    }
  };

  // Listen for events
  eventEmitter.on("newProduct", sendEvent);
  eventEmitter.on("newBusiness", sendEvent);
  eventEmitter.on("newMessage", sendEvent);
  eventEmitter.on("newComment", sendEvent); // Added to support commentController.js

  // Keep connection alive with a ping every 30 seconds
  const pingInterval = setInterval(() => {
    res.write(`: ping\n\n`);
  }, 30000);

  // Clean up on client disconnect
  req.on("close", () => {
    clearInterval(pingInterval);
    eventEmitter.off("newProduct", sendEvent);
    eventEmitter.off("newBusiness", sendEvent);
    eventEmitter.off("newMessage", sendEvent);
    eventEmitter.off("newComment", sendEvent);
  });
};

// Export the event emitter for use in other controllers
exports.eventEmitter = eventEmitter;
