import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { analyzeDesign } from '@/lib/analyzer';
import { formatDesignMd, formatPromptMd } from '@/lib/formatter';
import { getOutputDir, sanitizeError } from '@/lib/utils';

export const runtime = 'nodejs';
export const maxDuration = 120;

const SESSION_PATTERN = /^\d+-[a-z0-9-]+$/i;
const ALLOWED_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash'] as const;
type AllowedModel = (typeof ALLOWED_MODELS)[number];

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const { sessionId, model } = body as Record<string, unknown>;

  if (typeof sessionId !== 'string' || !SESSION_PATTERN.test(sessionId)) {
    return NextResponse.json({ success: false, error: 'Invalid session ID.' }, { status: 400 });
  }

  if (model !== undefined && !ALLOWED_MODELS.includes(model as AllowedModel)) {
    return NextResponse.json({ success: false, error: 'Invalid model.' }, { status: 400 });
  }

  try {
    const result = await analyzeDesign(sessionId, model as AllowedModel | undefined);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    // Read original URL from extracted.json to pass to formatter
    const outputDir = getOutputDir(sessionId);
    let sourceUrl = '';
    try {
      const extracted = JSON.parse(
        await fs.readFile(path.join(outputDir, 'extracted.json'), 'utf-8'),
      ) as { url?: string };
      sourceUrl = extracted.url ?? '';
    } catch {
      sourceUrl = '';
    }

    const designMd = formatDesignMd(result.designSystem, sourceUrl);
    const promptMd = formatPromptMd(result.designSystem, designMd);

    const designMdPath = path.join(outputDir, 'design.md');
    const promptMdPath = path.join(outputDir, 'prompt.md');

    await Promise.all([
      fs.writeFile(designMdPath, designMd),
      fs.writeFile(promptMdPath, promptMd),
    ]);

    return NextResponse.json({
      success: true,
      sessionId,
      designMdPath,
      promptMdPath,
      preview: designMd.slice(0, 500),
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: sanitizeError(err) },
      { status: 500 },
    );
  }
}
