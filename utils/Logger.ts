import fs from 'fs';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const getTimestamp = () => new Date().toISOString();

const writeLog = (level: string, message: string, data?: any) => {
  const timestamp = getTimestamp();
  const logEntry = {
    timestamp,
    level,
    message,
    data: data || null
  };

  const logLine = `[${level}] ${timestamp} - ${message}${
    data ? ` - ${typeof data === 'string' ? data : JSON.stringify(data)}` : ''
  }\n`;

  // اختيار ملف السجل
  const logFile = level === 'ERROR' 
    ? path.join(logsDir, 'error.log')
    : path.join(logsDir, 'app.log');

  try {
    fs.appendFileSync(logFile, logLine);
  } catch (err) {
    console.error(`Failed to write log: ${err}`);
  }
};

const logger = {
  info: (message: string, data?: any) => {
    const log = `[INFO] ${getTimestamp()} - ${message}`;
    console.log(log);
    writeLog('INFO', message, data);
  },

  warn: (message: string, data?: any) => {
    const log = `[WARN] ${getTimestamp()} - ${message}`;
    console.warn(log);
    writeLog('WARN', message, data);
  },

  error: (message: string, error?: any) => {
    const log = `[ERROR] ${getTimestamp()} - ${message}`;
    console.error(log);
    writeLog('ERROR', message, error);
  },

  debug: (message: string, data?: any) => {
    if (process.env.DEBUG === 'true') {
      const log = `[DEBUG] ${getTimestamp()} - ${message}`;
      console.log(log);
      writeLog('DEBUG', message, data);
    }
  }
};

export default logger;
