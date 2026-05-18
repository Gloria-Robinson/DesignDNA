import { NextRequest, NextResponse } from 'next/server';
import { extractDesign } from '@/lib/extractor';
import { validateUrl, generateSessionId, rateLimitCheck, sanitizeError } from '@/lib/utils';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const url = (body as Record<string, unknown>)?.url;
  if (typeof url !== 'string' || !url.trim()) {
    return NextResponse.json({ success: false, error: 'A URL is required.' }, { status: 400 });
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  if (!rateLimitCheck(ip)) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please wait before trying again.' },
      { status: 429 },
    );
  }

  const validation = validateUrl(url.trim());
  if (!validation.valid) {
    return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
  }

  const sessionId = generateSessionId(url.trim());

  try {
    const result = await extractDesign(url.trim(), sessionId);
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: sanitizeError(err) },
      { status: 500 },
    );
  }
}
