import { appendFile, mkdir } from 'fs/promises';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'designdna.log');

type Level = 'INFO' | 'WARN' | 'ERROR';

export async function log(
  level: Level,
  message: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const ts = new Date().toISOString();
  const entry = JSON.stringify({ ts, level, message, ...data }) + '\n';

  const consoleMsg = `[${ts}] ${level}: ${message}${data ? ' ' + JSON.stringify(data) : ''}`;
  if (level === 'ERROR') console.error(consoleMsg);
  else console.log(consoleMsg);

  try {
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(LOG_FILE, entry);
  } catch {
    // Logging must never crash the app
  }
}
