import fs from "fs";
import config from "../config.json";
import { Config } from "./types";

const typedConfig = config as Config;

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

/**
 * Centralized logging function that handles all console output and file logging.
 * @param level - The log level (DEBUG, INFO, WARN, ERROR)
 * @param message - The main message to log
 * @param data - Optional additional data to log (objects, errors, etc.)
 */
export function logToFile(level: LogLevel, message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level}] ${message}`;

  // Always output to console
  switch (level) {
    case LogLevel.ERROR:
      console.error(formattedMessage, data !== undefined ? data : "");
      break;
    case LogLevel.WARN:
      console.warn(formattedMessage, data !== undefined ? data : "");
      break;
    case LogLevel.DEBUG:
    case LogLevel.INFO:
    default:
      console.log(formattedMessage, data !== undefined ? data : "");
      break;
  }

  // Write to file only if debug is enabled
  if (typedConfig.app.debug) {
    try {
      let logLine = formattedMessage;
      
      if (data !== undefined) {
        if (data instanceof Error) {
          logLine += `\n  Error: ${data.message}\n  Stack: ${data.stack}`;
        } else if (typeof data === "object") {
          logLine += `\n  Data: ${JSON.stringify(data, null, 2)}`;
        } else {
          logLine += ` ${data}`;
        }
      }
      
      logLine += "\n";
      
      fs.appendFileSync(typedConfig.app.log_file_name, logLine);
    } catch (error) {
      // Fallback to console if file writing fails
      console.error("Failed to write to log file:", error);
    }
  }
}

// Convenience functions for different log levels
export const logger = {
  debug: (message: string, data?: unknown) => logToFile(LogLevel.DEBUG, message, data),
  info: (message: string, data?: unknown) => logToFile(LogLevel.INFO, message, data),
  warn: (message: string, data?: unknown) => logToFile(LogLevel.WARN, message, data),
  error: (message: string, data?: unknown) => logToFile(LogLevel.ERROR, message, data),
};
