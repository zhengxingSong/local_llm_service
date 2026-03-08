import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { getConfig } from '../config/index.js';

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp as string} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

let logger: winston.Logger;

export function initLogger(): winston.Logger {
  const config = getConfig();

  const transports: winston.transport[] = [];

  // Console transport
  if (config.logging.console) {
    transports.push(
      new winston.transports.Console({
        format: combine(colorize(), timestamp(), logFormat),
      })
    );
  }

  // File transport with rotation
  if (config.logging.file) {
    transports.push(
      new DailyRotateFile({
        filename: config.logging.file,
        datePattern: config.logging.datePattern || 'YYYY-MM-DD',
        maxSize: config.logging.maxSize,
        maxFiles: config.logging.maxFiles,
        format: combine(timestamp(), logFormat),
      })
    );
  }

  logger = winston.createLogger({
    level: config.logging.level,
    transports,
  });

  return logger;
}

export function getLogger(): winston.Logger {
  if (!logger) {
    return initLogger();
  }
  return logger;
}

export default getLogger();
