import { GoogleGenAI } from '@google/genai';
import { promises as fs } from 'fs';
import path from 'path';
import { getOutputDir, sanitizeError, sleep } from '@/lib/utils';
import type { AnalysisResult, DesignSystem } from '@/types/analysis';

const REQUIRED_FIELDS: (keyof DesignSystem)[] = [
  'siteName', 'sourceUrl', 'brandTone', 'colors',
  'typography', 'spacing', 'motion', 'layout', 'components',
];

const SYSTEM_PROMPT = `You are a professional design systems analyst. Analyze the provided website screenshot, extracted CSS data, and scroll frames, then return a SINGLE valid JSON object describing the complete design system.

Return ONLY the JSON object — no markdown fences, no explanation, no comments.
Extract EXACT values from the screenshot — hex codes, px sizes, CSS values — never guess or approximate.

⚠️ CRITICAL — BACKGROUND COLOR RULE:
Look at the screenshot carefully FIRST. Determine if the page background is LIGHT or DARK.
- If the page body/hero background is WHITE or near-white → bg-primary MUST be "#ffffff" or the actual light hex.
- If the page body/hero background is BLACK or near-black → bg-primary MUST be that dark hex.
- MANY popular sites (Wise, Stripe light, Airbnb, Apple, Linear) are LIGHT themed with white/off-white backgrounds. Do NOT default to dark.
- The text color should be the OPPOSITE of the background: light bg → dark text; dark bg → light text.

The JSON must match this exact structure (replace ALL placeholder values with real extracted values):
{
  "siteName": "string — actual site/brand name",
  "sourceUrl": "string — URL from extracted data",
  "brandTone": ["adjective1", "adjective2", "adjective3"],
  "colors": [
    { "token": "bg-primary",      "hex": "#REPLACE_WITH_ACTUAL_BG",    "usage": "Main page background" },
    { "token": "text-primary",    "hex": "#REPLACE_WITH_ACTUAL_TEXT",  "usage": "Headings and body text" },
    { "token": "text-secondary",  "hex": "#REPLACE_WITH_MUTED_TEXT",   "usage": "Subtext, captions" },
    { "token": "accent",          "hex": "#REPLACE_WITH_CTA_COLOR",    "usage": "CTAs, links, highlights" },
    { "token": "accent-secondary","hex": "#REPLACE_WITH_2ND_ACCENT",   "usage": "Secondary accent or hover" },
    { "token": "surface",         "hex": "#REPLACE_WITH_CARD_BG",      "usage": "Cards, panels, sections" },
    { "token": "border",          "hex": "#REPLACE_WITH_BORDER",       "usage": "Dividers, card borders" }
  ],
  "gradients": [
    { "name": "hero-bg",     "value": "CSS gradient value if present, else omit this array", "usage": "Hero background" },
    { "name": "accent-text", "value": "CSS gradient value if text uses gradient, else omit", "usage": "Gradient headline text" }
  ],
  "background": {
    "type": "solid | gradient-mesh | image | video",
    "value": "Full CSS background value for the hero section",
    "effect": "Plain English description of the background visual"
  },
  "typography": {
    "fontFamily": "Actual font name from CSS (e.g. Inter, Sohne, Graphik, TWK Everett)",
    "fallback": "sans-serif or serif depending on the font",
    "scaleRatio": "1.25",
    "sizes": [14, 16, 18, 24, 32, 48, 64, 80],
    "body": { "size": 18, "weight": 400, "lineHeight": "1.6" },
    "h1": { "size": 72, "weight": 700, "lineHeight": "1.05" },
    "h2": { "size": 48, "weight": 700, "lineHeight": "1.1" },
    "h3": { "size": 32, "weight": 600, "lineHeight": "1.2" },
    "letterSpacing": "-0.02em"
  },
  "spacing": {
    "baseUnit": 8,
    "scale": [4, 8, 12, 16, 24, 32, 48, 64, 96, 128],
    "sectionPadding": 96
  },
  "motion": {
    "pageLoad": [{ "element": "hero", "animation": "fade-up", "duration": "0.6s", "easing": "ease-out" }],
    "scroll": [{ "element": "cards", "description": "fade in on enter" }],
    "hover": { "buttons": "background darkens 0.2s", "cards": "translateY(-4px) 0.3s", "navLinks": "opacity increases 0.15s" },
    "click": "scale(0.97) 0.1s"
  },
  "layout": {
    "maxContentWidth": 1200,
    "gridColumns": 12,
    "gridGap": 24,
    "breakpoints": ["640px", "768px", "1024px", "1280px"]
  },
  "components": {
    "cards": { "radius": "12px", "shadow": "0 4px 24px rgba(0,0,0,0.08)", "border": "1px solid #e5e7eb" },
    "buttons": { "shape": "rounded-full", "padding": "12px 28px", "style": "filled with accent color" },
    "navigation": { "position": "sticky", "blur": false, "border": "1px solid rgba(0,0,0,0.08)" },
    "badges": { "shape": "rounded-full", "padding": "6px 14px", "style": "border, transparent bg" },
    "inputs": { "radius": "6px", "border": "1px solid #e5e7eb", "background": "#ffffff" }
  }
}

Extraction rules:
- bg-primary: The DOMINANT page background color. Look at the body/html background in the CSS data AND the screenshot. If it looks white/cream/light → use that light hex.
- text-primary: The main body/heading text color. On a light site this will be near-black (#111, #1a1a1a, etc).
- accent: The brand's primary color used on CTAs and key interactive elements.
- gradients: Only include if gradients are actually visible on the site. If no gradient → omit the gradients field entirely.
- background: Only include if the hero has a non-solid background effect. Solid color → omit this field.
- navigation.blur: Set true ONLY if nav has frosted glass / backdrop-filter effect.
- typography.fontFamily: Read font-family from the CSS data — use the actual font name, not a generic fallback.
- typography.letterSpacing: Measure from the CSS data. Minimal/editorial sites have tight tracking (-0.02em to -0.05em). Friendly/rounded sites may have 0 or positive tracking.
- All hex values must be valid 6-digit hex starting with #. All px sizes must be integers.`;

function parseDesignSystem(raw: string): DesignSystem {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  const parsed = JSON.parse(cleaned) as Record<string, unknown>;

  for (const field of REQUIRED_FIELDS) {
    if (parsed[field] === undefined || parsed[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return parsed as DesignSystem;
}

function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('exhausted');
}

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

async function callGemini(
  parts: Part[],
  model: string,
  temperature: number,
  attempt = 0,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts }],
      config: { temperature, maxOutputTokens: 4096 },
    });
    return response.text ?? '';
  } catch (err) {
    if (isRateLimitError(err) && attempt < 3) {
      await sleep(Math.pow(2, attempt + 1) * 1000);
      return callGemini(parts, model, temperature, attempt + 1);
    }
    throw err;
  }
}

async function callGroq(
  screenshotBase64: string,
  extractedJson: string,
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') throw new Error('GROQ_API_KEY is not set');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.2-11b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: SYSTEM_PROMPT },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${screenshotBase64}` } },
            { type: 'text', text: `EXTRACTED CSS TOKENS:\n${extractedJson}` },
            { type: 'text', text: 'Return ONLY the JSON object. No markdown, no explanation.' },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Groq error ${response.status}: ${body.slice(0, 200)}`);
  }

  const json = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned no content');
  return content;
}

async function callOpenRouter(
  screenshotBase64: string,
  extractedJson: string,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.2-11b-vision-instruct:free',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: SYSTEM_PROMPT },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${screenshotBase64}` } },
            { type: 'text', text: `EXTRACTED CSS DATA:\n${extractedJson}` },
            { type: 'text', text: 'Return ONLY the JSON object.' },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status}`);
  }

  const json = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned no content');
  return content;
}

export async function analyzeDesign(
  sessionId: string,
  model = 'gemini-2.0-flash',
): Promise<AnalysisResult> {
  const outputDir = getOutputDir(sessionId);

  try {
    // Read screenshot and extracted data
    const [screenshotBuf, extractedJson] = await Promise.all([
      fs.readFile(path.join(outputDir, 'screenshot.png')),
      fs.readFile(path.join(outputDir, 'extracted.json'), 'utf-8'),
    ]);
    const screenshotBase64 = screenshotBuf.toString('base64');

    // Trim extracted JSON — send only the summary tokens, not the full element list
    // (elements array can be 100KB+; the deduped sets are what matters for AI analysis)
    const fullExtracted = JSON.parse(extractedJson) as {
      url?: string;
      colorPalette?: string[];
      fontFamilies?: string[];
      spacingValues?: string[];
      animationTokens?: string[];
      elements?: unknown[];
    };
    const trimmedJson = JSON.stringify({
      url: fullExtracted.url,
      colorPalette: fullExtracted.colorPalette,
      fontFamilies: fullExtracted.fontFamilies,
      spacingValues: fullExtracted.spacingValues,
      animationTokens: fullExtracted.animationTokens,
      elementCount: fullExtracted.elements?.length ?? 0,
    });

    // Read 5 JPEG frames (top / 25% / mid / 75% / bottom)
    const frameBufs = await Promise.all(
      [0, 1, 2, 3, 4].map(async i => {
        try {
          const buf = await fs.readFile(path.join(outputDir, `frame-${i}.jpg`));
          return buf.toString('base64');
        } catch {
          return null;
        }
      }),
    );

    // Build Gemini parts — screenshot → JSON summary → frames
    const parts: Part[] = [
      { text: SYSTEM_PROMPT },
      { inlineData: { mimeType: 'image/png', data: screenshotBase64 } },
      { text: `EXTRACTED CSS TOKENS:\n${trimmedJson}` },
      ...frameBufs
        .filter((b): b is string => b !== null)
        .map((data): Part => ({ inlineData: { mimeType: 'image/jpeg', data } })),
      { text: 'Return ONLY the JSON object. No markdown, no explanation.' },
    ];

    let rawResponse: string;
    let modelUsed = model;

    try {
      rawResponse = await callGemini(parts, model, 0.2);
    } catch (geminiErr) {
      // Gemini retry with lower temperature
      try {
        rawResponse = await callGemini(parts, model, 0.1);
      } catch {
        // Groq fallback (free tier, vision-capable)
        try {
          rawResponse = await callGroq(screenshotBase64, trimmedJson);
          modelUsed = 'llama-3.2-11b-vision-preview';
        } catch {
          // OpenRouter last resort
          try {
            rawResponse = await callOpenRouter(screenshotBase64, trimmedJson);
            modelUsed = 'meta-llama/llama-3.2-11b-vision-instruct:free';
          } catch {
            throw new Error(`All AI providers failed. Last error: ${sanitizeError(geminiErr)}`);
          }
        }
      }
    }

    // Parse and validate JSON
    let designSystem: DesignSystem;
    try {
      designSystem = parseDesignSystem(rawResponse);
    } catch {
      // Malformed JSON — retry with a stricter prompt through the same fallback chain
      const retryParts: Part[] = [
        ...parts.slice(0, -1),
        { text: 'IMPORTANT: Your previous response was not valid JSON. Return ONLY a raw JSON object. No text before or after. No markdown fences. Start with { and end with }.' },
      ];
      let retryResponse: string;
      try {
        retryResponse = await callGemini(retryParts, model, 0.1);
      } catch {
        try {
          retryResponse = await callGroq(screenshotBase64, trimmedJson);
        } catch {
          retryResponse = await callOpenRouter(screenshotBase64, trimmedJson);
        }
      }
      designSystem = parseDesignSystem(retryResponse);
      rawResponse = retryResponse;
    }

    return {
      success: true,
      designSystem,
      modelUsed,
      rawResponse,
    };
  } catch (err) {
    return {
      success: false,
      designSystem: null as unknown as DesignSystem,
      error: sanitizeError(err),
    };
  }
}
