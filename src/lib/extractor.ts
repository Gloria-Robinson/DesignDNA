import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';
import { ensureDir, getOutputDir, getVideoDir, sanitizeError } from '@/lib/utils';
import type { ExtractedCSS, ExtractionResult } from '@/types/extraction';

async function getFullPageHeight(page: import('playwright').Page): Promise<number> {
  return page.evaluate(() =>
    Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight,
    ),
  );
}

export async function extractDesign(url: string, sessionId: string): Promise<ExtractionResult> {
  const outputDir = getOutputDir(sessionId);
  const sessionVideoDir = path.join(getVideoDir(), sessionId);

  await Promise.all([ensureDir(outputDir), ensureDir(sessionVideoDir)]);

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: true,
  });

  let contextClosed = false;

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      recordVideo: {
        dir: sessionVideoDir,
        size: { width: 1440, height: 900 },
      },
    });

    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Allow up to 5s for network to settle — many sites never reach true networkidle
    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
      // Proceed — page is loaded, ongoing background requests are fine
    }

    // Wait for JS-rendered content to expand the DOM
    await page.waitForTimeout(800);

    // Full-page screenshot
    const screenshotPath = path.join(outputDir, 'screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // CSS extraction — runs inside the browser context
    const rawExtracted = await page.evaluate(() => {
      const cssProps = [
        'color', 'backgroundColor', 'fontFamily', 'fontSize', 'fontWeight',
        'lineHeight', 'letterSpacing', 'padding', 'margin', 'borderRadius',
        'boxShadow', 'transition', 'animation', 'display', 'gridTemplateColumns',
        'gap', 'flexDirection',
      ] as const;

      const skipTags = new Set(['SCRIPT', 'STYLE', 'META', 'LINK', 'HEAD', 'NOSCRIPT']);
      const elements = Array.from(document.querySelectorAll('body *'))
        .filter(el => !skipTags.has(el.tagName))
        .slice(0, 200);

      const colorSet = new Set<string>();
      const fontSet = new Set<string>();
      const spacingSet = new Set<string>();
      const animSet = new Set<string>();

      const extractedElements = elements.map((el, i) => {
        const style = window.getComputedStyle(el);
        const props: Record<string, string> = {};

        for (const prop of cssProps) {
          props[prop] = style[prop as keyof CSSStyleDeclaration] as string ?? '';
        }

        if (props.color) colorSet.add(props.color);
        if (props.backgroundColor && props.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          colorSet.add(props.backgroundColor);
        }
        if (props.fontFamily) fontSet.add(props.fontFamily);
        if (props.padding && props.padding !== '0px') spacingSet.add(props.padding);
        if (props.margin && props.margin !== '0px') spacingSet.add(props.margin);
        if (props.gap && props.gap !== 'normal') spacingSet.add(props.gap);
        if (props.transition && props.transition !== 'all 0s ease 0s') animSet.add(props.transition);
        if (props.animation && props.animation !== 'none 0s ease 0s 1 normal none running') {
          animSet.add(props.animation);
        }

        const tagName = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        const cls = el.classList.length > 0 ? `.${el.classList[0]}` : '';
        const selector = `${tagName}${id || cls || `:nth-child(${i + 1})`}`;

        return { selector, tagName, properties: props };
      });

      return {
        elements: extractedElements,
        colorPalette: Array.from(colorSet).slice(0, 30),
        fontFamilies: Array.from(fontSet).slice(0, 10),
        spacingValues: Array.from(spacingSet).slice(0, 30),
        animationTokens: Array.from(animSet).slice(0, 20),
      };
    });

    const extractedCSS: ExtractedCSS = {
      url,
      timestamp: new Date().toISOString(),
      viewport: { width: 1440, height: 900 },
      elements: rawExtracted.elements as ExtractedCSS['elements'],
      colorPalette: rawExtracted.colorPalette,
      fontFamilies: rawExtracted.fontFamilies,
      spacingValues: rawExtracted.spacingValues,
      animationTokens: rawExtracted.animationTokens,
    };

    const extractedDataPath = path.join(outputDir, 'extracted.json');
    await fs.writeFile(extractedDataPath, JSON.stringify(extractedCSS, null, 2));

    // Get page height AFTER content has fully rendered
    const pageHeight = await getFullPageHeight(page);

    // Capture 5 JPEG frames — top / 25% / mid / 75% / bottom
    // These are the images the AI actually analyzes — more coverage = better extraction
    const framePositions = [0, 0.25, 0.5, 0.75, 1.0];
    const framePaths: string[] = [];

    for (let i = 0; i < framePositions.length; i++) {
      const scrollY = Math.floor(pageHeight * framePositions[i]);
      await page.evaluate((y: number) => window.scrollTo({ top: y, behavior: 'instant' }), scrollY);
      // Wait for lazy-loaded images/components to appear at this scroll depth
      await page.waitForTimeout(200);
      const framePath = path.join(outputDir, `frame-${i}.jpg`);
      await page.screenshot({ path: framePath, type: 'jpeg', quality: 75 });
      framePaths.push(framePath);
    }

    // ── Video scroll simulation ──────────────────────────────────────────────
    // Reset to top, then do a slow realistic scroll so the video shows all sections
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(300);

    // Position mouse in center of viewport — required for mouse.wheel to work
    await page.mouse.move(720, 450);

    // 120px per tick @ 60ms = ~2000px/s — covers full page without being too slow
    const scrollStep = 120;
    const stepDelay = 60;
    const totalSteps = Math.ceil(pageHeight / scrollStep);

    for (let i = 0; i < totalSteps; i++) {
      await page.mouse.wheel(0, scrollStep);
      await page.waitForTimeout(stepDelay);
    }

    await page.waitForTimeout(300);

    // Hover over key interactive elements to capture hover state animations
    const interactiveSelectors = ['nav a', 'button', '[class*="card"]'];
    for (const selector of interactiveSelectors) {
      const els = await page.$$(selector);
      for (const el of els.slice(0, 2)) {
        try {
          const box = await el.boundingBox();
          if (box) {
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.waitForTimeout(250);
          }
        } catch {
          // Element may have detached — skip
        }
      }
    }

    // Close context first — this finalizes the video file
    contextClosed = true;
    await context.close();
    await browser.close();

    // Move the video Playwright saved into the session output dir
    let videoPath = '';
    try {
      const videoFiles = await fs.readdir(sessionVideoDir);
      const webmFile = videoFiles.find(f => f.endsWith('.webm'));
      if (webmFile) {
        const src = path.join(sessionVideoDir, webmFile);
        videoPath = path.join(outputDir, 'video.webm');
        await fs.rename(src, videoPath);
      }
    } catch {
      // Video move failure is non-fatal
    }

    return {
      success: true,
      sessionId,
      screenshotPath,
      extractedDataPath,
      videoPath,
      framePaths,
    };
  } catch (err) {
    if (!contextClosed) {
      try { await browser.close(); } catch { /* already closed */ }
    }
    return {
      success: false,
      sessionId,
      screenshotPath: '',
      extractedDataPath: '',
      videoPath: '',
      framePaths: [],
      error: sanitizeError(err),
    };
  }
}
