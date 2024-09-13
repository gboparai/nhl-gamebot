import fs from 'fs';

/**
 * Logs the given object to a file.
 * @param obj - The object to be logged.
 * @param header - The header to be included in the log.
 */
export function logObjectToFile(obj: unknown, header: string) {
  const dateTime = new Date().toISOString();
  const logData = `${dateTime}\n${header}\n${JSON.stringify(obj)}\n\n`;
  fs.appendFileSync("./logfile.txt", logData);
}
