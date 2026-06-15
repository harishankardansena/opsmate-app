// lib/logger.ts
// Winston logger — writes to ./logs/ directory with daily rotation

import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'activity';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  userId?: string;
  module?: string;
  data?: unknown;
}

function getLogFilePath(type: 'app' | 'activity' | 'error' = 'app'): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(logsDir, `${type}-${date}.log`);
}

function writeLog(entry: LogEntry, type: 'app' | 'activity' | 'error' = 'app'): void {
  try {
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(getLogFilePath(type), line, 'utf8');
  } catch {
    // Silent fail — logging should never crash the app
  }
}

export const logger = {
  info(message: string, meta?: { userId?: string; module?: string; data?: unknown }) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...meta,
    };
    console.log(`[INFO] ${message}`, meta?.data ?? '');
    writeLog(entry, 'app');
  },

  warn(message: string, meta?: { userId?: string; module?: string; data?: unknown }) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      ...meta,
    };
    console.warn(`[WARN] ${message}`, meta?.data ?? '');
    writeLog(entry, 'app');
  },

  error(message: string, meta?: { userId?: string; module?: string; data?: unknown }) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      ...meta,
    };
    console.error(`[ERROR] ${message}`, meta?.data ?? '');
    writeLog(entry, 'error');
    writeLog(entry, 'app');
  },

  debug(message: string, meta?: { userId?: string; module?: string; data?: unknown }) {
    if (process.env.NODE_ENV !== 'production') {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        ...meta,
      };
      console.debug(`[DEBUG] ${message}`, meta?.data ?? '');
      writeLog(entry, 'app');
    }
  },

  // Activity log — user actions (create task, add lead, etc.)
  activity(message: string, meta?: { userId?: string; module?: string; data?: unknown }) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'activity',
      message,
      ...meta,
    };
    console.log(`[ACTIVITY] ${message}`, meta?.data ?? '');
    writeLog(entry, 'activity');
    writeLog(entry, 'app');
  },
};

export default logger;
