import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import winston from "winston"

// Get the directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "../../logs")
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
)

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  defaultMeta: { service: "campus-marketplace" },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
})

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  )
}

// Create a stream object with a write function that will be used by morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim())
  },
}

// Export a wrapper that includes both winston logger and console methods
export default {
  error: (message, meta = {}) => {
    logger.error(message, meta)
    if (process.env.NODE_ENV !== "production") {
      console.error(message, meta)
    }
  },
  warn: (message, meta = {}) => {
    logger.warn(message, meta)
    if (process.env.NODE_ENV !== "production") {
      console.warn(message, meta)
    }
  },
  info: (message, meta = {}) => {
    logger.info(message, meta)
    if (process.env.NODE_ENV !== "production") {
      console.info(message, meta)
    }
  },
  debug: (message, meta = {}) => {
    logger.debug(message, meta)
    if (process.env.NODE_ENV !== "production") {
      console.debug(message, meta)
    }
  },
  stream: logger.stream,
}

