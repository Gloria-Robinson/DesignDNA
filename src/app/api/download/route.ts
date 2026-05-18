import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getOutputDir } from '@/lib/utils';

export const runtime = 'nodejs';

const SESSION_PATTERN = /^\d+-[a-z0-9-]+$/i;

const FILE_MAP = {
  design: { filename: 'design.md', mime: 'text/markdown' },
  prompt: { filename: 'prompt.md', mime: 'text/markdown' },
  screenshot: { filename: 'screenshot.png', mime: 'image/png' },
} as const;

type FileParam = keyof typeof FILE_MAP;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const file = searchParams.get('file') as FileParam | null;

  if (!sessionId || !SESSION_PATTERN.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid session ID.' }, { status: 400 });
  }

  if (!file || !(file in FILE_MAP)) {
    return NextResponse.json({ error: 'Invalid file parameter.' }, { status: 400 });
  }

  const { filename, mime } = FILE_MAP[file];

  // Path traversal prevention — resolve and verify it stays within outputs dir
  const outputDir = getOutputDir(sessionId);
  const resolvedBase = path.resolve(process.env.OUTPUT_DIR ?? './outputs');
  const resolvedPath = path.resolve(outputDir, filename);

  if (!resolvedPath.startsWith(resolvedBase)) {
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
  }

  let contents: Buffer;
  try {
    contents = await fs.readFile(resolvedPath);
  } catch {
    return NextResponse.json({ error: 'File not found.' }, { status: 404 });
  }

  return new NextResponse(contents.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(contents.length),
    },
  });
}
