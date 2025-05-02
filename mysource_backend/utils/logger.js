const fs = require('fs');
const path = require('path');

// Define logger functions
const info = (message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [INFO] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}\n`;

  console.log(`[INFO] ${message}`, meta);
  writeToLog(path.join(process.cwd(), 'logs', 'info.log'), logMessage);
};

const error = (message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [ERROR] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}\n`;

  console.error(`[ERROR] ${message}`, meta);
  writeToLog(path.join(process.cwd(), 'logs', 'error.log'), logMessage);
};

const warn = (message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [WARN] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}\n`;

  console.warn(`[WARN] ${message}`, meta);
  writeToLog(path.join(process.cwd(), 'logs', 'warn.log'), logMessage);
};

const debug = (message, meta = {}) => {
  if (process.env.NODE_ENV !== 'production') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [DEBUG] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}\n`;

    console.debug(`[DEBUG] ${message}`, meta);
    writeToLog(path.join(process.cwd(), 'logs', 'debug.log'), logMessage);
  }
};

// Write to log file with error handling
const writeToLog = (filePath, message) => {
  try {
    fs.appendFileSync(filePath, message);
    // Add a console log to confirm writing to log file
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Log written to ${filePath}`);
    }
  } catch (error) {
    console.error(`Failed to write to log file ${filePath}:`, error);
    // Try to create the directory if it doesn't exist
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        // Try writing again
        fs.appendFileSync(filePath, message);
        console.log(`Created log directory and wrote to ${filePath}`);
      }
    } catch (mkdirError) {
      console.error(`Failed to create log directory:`, mkdirError);
    }
  }
};

// Create the logger object with all functions
const logger = {
  
  error,
  info,
  warn,
  debug,
  writeToLog,
};

// Export both named exports and default export
exports.info = info;
exports.error = error;
exports.warn = warn;
exports.debug = debug;
exports.writeToLog = writeToLog;
exports.default = logger;