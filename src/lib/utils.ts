import { mkdir } from 'fs/promises';
import path from 'path';

// SSRF block list — RFC1918 + loopback + link-local
const BLOCKED_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^\[::1\]$/,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
];

export function validateUrl(url: string): { valid: boolean; error?: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: 'Please enter a valid URL.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only http and https URLs are supported.' };
  }

  const hostname = parsed.hostname;
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, error: 'That URL is not allowed.' };
    }
  }

  return { valid: true };
}

export function generateSessionId(url: string): string {
  const hostname = new URL(url).hostname.replace(/[^a-z0-9]/gi, '-');
  return `${Date.now()}-${hostname}`;
}

export function getOutputDir(sessionId: string): string {
  return path.join(process.env.OUTPUT_DIR ?? './outputs', sessionId);
}

export function getVideoDir(): string {
  return process.env.VIDEO_DIR ?? './videos';
}

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

// In-memory rate limiter — process-local, sufficient for single PM2 process
const ipTimestamps = new Map<string, number[]>();

export function rateLimitCheck(ip: string): boolean {
  const maxPerHour = parseInt(process.env.MAX_REQUESTS_PER_IP_PER_HOUR ?? '10', 10);
  const windowMs = 60 * 60 * 1000;
  const now = Date.now();

  const timestamps = (ipTimestamps.get(ip) ?? []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxPerHour) return false;

  timestamps.push(now);
  ipTimestamps.set(ip, timestamps);
  return true;
}

export function sanitizeError(err: unknown): string {
  if (err instanceof Error) {
    // Return only the message — never the stack or internal paths
    const msg = err.message.replace(/\/.+?\.(ts|js):\d+/g, '[internal]');
    return msg.length > 200 ? msg.slice(0, 200) + '…' : msg;
  }
  if (typeof err === 'string') return err.slice(0, 200);
  return 'An unexpected error occurred. Please try again.';
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
