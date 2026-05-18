# AGENTS.md — designdna
> **⚠️ MANDATORY FOR ALL AI ASSISTANTS AND DEVELOPERS**
> This is the single source of truth for this project.
> Every AI agent MUST read this file in full before writing a single line of code.
> Every AI agent MUST use a skill before touching any domain. No exceptions.
> If you are an AI assistant and you have NOT read this file yet — stop, read it now, then proceed.

---

## 🔴 CRITICAL RULES FOR ALL AI AGENTS

1. **READ THIS FILE FIRST** — Before any task, read `AGENTS.md` completely. No shortcuts.
2. **SKILLS ARE MANDATORY** — You MUST load and read the relevant skill before writing any code. Writing code without reading the skill first is strictly prohibited.
3. **NO BLIND CODING** — If you cannot find a skill for a task, say: *"I need a skill for [X], please run `npx skills search [keyword]` to find it"* — do not improvise.
4. **ASK BEFORE ASSUMING** — If requirements are unclear, ask. Do not guess and build.
5. **ONE TASK AT A TIME** — Complete and confirm each task before moving to the next.
6. **NEVER BREAK EXISTING FEATURES** — When adding something new, verify existing functionality still works.
7. **FOLLOW THE STACK** — Do not introduce libraries, frameworks, or tools not listed in this file without explicit approval.
8. **TYPESCRIPT EVERYWHERE** — All code must be TypeScript. No `.js` files allowed.
9. **UPDATE THIS FILE** — If you add a new pattern, dependency, or convention, update `AGENTS.md` and the date at the bottom.

---

## 🧠 Project Overview

### Project Name
**designdna** — A tool that extracts the full design DNA of any website and outputs a structured design system ready for AI-powered recreation.

### What It Does
Takes any public website URL and automatically:
1. Opens the site in a real headless browser (Playwright)
2. Takes a full-page screenshot
3. Records a video of the site with scroll + hover interactions
4. Extracts the complete CSS design system (colors, fonts, spacing, motion, layout)
5. Sends screenshot + CSS data + video frames to Gemini AI for analysis
6. Outputs two ready-to-use files:
   - `design.md` — human-readable design system document
   - `prompt.md` — AI-ready prompt for recreating the site's aesthetic in any AI coding tool

### Why It Exists
Most AI-generated websites look generic because the AI guesses at design values. designdna gives AI exact values — spacing, typography, color tokens, motion timing — extracted directly from real production websites, making recreations feel authentic.

### Target User
Developers and designers who want to recreate or draw inspiration from existing websites using AI coding tools (Claude Code, Cursor, v0, Gemini CLI, etc.).

---

## 🗂️ Project Structure

```
designdna/
├── AGENTS.md                        ← YOU ARE HERE. Read before anything else.
├── .env.local                       ← API keys (NEVER commit this file)
├── .env.example                     ← Safe template (commit this)
├── next.config.ts
├── tsconfig.json
├── package.json
├── tailwind.config.ts
│
├── src/
│   ├── app/                         ← Next.js App Router
│   │   ├── layout.tsx               ← Root layout
│   │   ├── page.tsx                 ← Home page (URL input UI)
│   │   ├── globals.css              ← Global styles
│   │   │
│   │   └── api/                     ← Backend (server-side only)
│   │       ├── extract/
│   │       │   └── route.ts         ← POST: Playwright extraction
│   │       ├── analyze/
│   │       │   └── route.ts         ← POST: Gemini AI analysis
│   │       └── download/
│   │           └── route.ts         ← GET: file download serving
│   │
│   ├── components/                  ← React UI components (client-side)
│   │   ├── UrlForm.tsx              ← URL input form
│   │   ├── ResultPreview.tsx        ← Screenshot + design.md preview
│   │   ├── DownloadButtons.tsx      ← Download + copy buttons
│   │   └── LoadingState.tsx         ← Step-by-step progress indicator
│   │
│   ├── lib/                         ← Core business logic (server-side only)
│   │   ├── extractor.ts             ← Playwright: screenshot + CSS + video
│   │   ├── analyzer.ts              ← Gemini API: vision + analysis
│   │   ├── formatter.ts             ← Formats output → design.md + prompt.md
│   │   └── utils.ts                 ← Shared utilities (URL validation etc.)
│   │
│   └── types/                       ← TypeScript type definitions
│       ├── extraction.ts            ← ExtractedCSS, ExtractionResult
│       ├── analysis.ts              ← AnalysisResult, DesignSystem
│       └── api.ts                   ← API request/response types
│
├── outputs/                         ← Generated files (gitignored)
│   └── [timestamp]-[domain]/
│       ├── screenshot.png
│       ├── extracted.json
│       ├── video.webm
│       ├── design.md
│       └── prompt.md
│
└── videos/                          ← Temporary recordings (gitignored)
```

---

## ⚡ Project Setup Commands

### Create the project
```bash
npx create-next-app@latest designdna --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd designdna
```

### Install dependencies
```bash
npm install playwright @google/generative-ai
npx playwright install chromium
```

### Create required directories
```bash
mkdir -p outputs videos
```

### Run locally
```bash
npm run dev    # → http://localhost:3000
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15.x App Router | Full-stack framework |
| TypeScript | 5.x | Mandatory language |
| Tailwind CSS | 4.x | Styling |
| React | 19.x | UI |

### Backend (Next.js API Routes — server-side only)
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js API Routes | 15.x | Server endpoints |
| Playwright | Latest | Headless browser automation |
| @google/generative-ai | Latest | Gemini SDK |
| Node.js | 20.x LTS | Runtime |

### AI Vision Models
| Model | Provider | Use Case | Cost |
|-------|---------|---------|------|
| Gemini 2.0 Flash | Google AI Studio | Default — free tier | Free |
| Gemini 2.5 Flash | Google AI Studio | Production — better video | ~$0.30/1M tokens |
| Qwen2.5-VL | OpenRouter | Fallback — screenshot only | ~$0.02/1M tokens |

### Infrastructure
| Service | Purpose | Status |
|---------|---------|--------|
| VPS Linux | App hosting | ✅ Already owned |
| Custom Domain | Public URL | ✅ Already owned |
| PM2 | Process manager | To configure |
| Nginx | Reverse proxy | To configure |

---

## 🔑 Environment Variables

All secrets live in `.env.local`. **Never commit this file.**

```env
# Google Gemini API (get from aistudio.google.com)
GEMINI_API_KEY=your_key_here

# OpenRouter — fallback AI (get from openrouter.ai)
OPENROUTER_API_KEY=your_key_here

# App config
NEXT_PUBLIC_APP_URL=https://yourdomain.com
OUTPUT_DIR=./outputs
VIDEO_DIR=./videos
MAX_ANALYSIS_TIMEOUT_MS=60000

# Rate limiting
MAX_REQUESTS_PER_IP_PER_HOUR=10
```

Copy `.env.example` → `.env.local` and fill in values before running.

---

## 📋 SKILLS — MANDATORY

> ⚠️ **Every AI agent MUST load and read the relevant skill BEFORE writing any code.**
> Skills contain exact library versions, patterns, and constraints specific to this environment.
> Skipping skills will produce wrong, inconsistent, or broken code. No exceptions.

### How to Load a Skill
All skills are installed globally at `~\.agents\skills\[skill-name]`.
Read the skill's markdown file completely before writing code for that domain.
If a skill is missing, run `npx skills search [keyword]` before proceeding.

---

### ✅ CONFIRMED INSTALLED SKILLS

#### 🎭 Playwright — Browser Automation + Scraping
| Task | Skill | Path |
|------|-------|------|
| All Playwright code | `playwright-best-practices` | `~\.agents\skills\playwright-best-practices` |
| CSS extraction / scraping | `playwright-scraper` | `~\.agents\skills\playwright-scraper` |
| Sites blocking automation | `playwright-bot-bypass` | `~\.agents\skills\playwright-bot-bypass` |

> Read `playwright-best-practices` first for ANY Playwright task.
> Then `playwright-scraper` for extraction logic.
> Only read `playwright-bot-bypass` when a site actively blocks.

---

#### 🤖 Gemini AI Integration
| Task | Skill | Path |
|------|-------|------|
| Gemini API calls (core) | `gemini-api` | `~\.agents\skills\gemini-api` |
| Gemini vision + multimodal | `gemini-interactions-api` | `~\.agents\skills\gemini-interactions-api` |
| Gemini integration patterns | `gemini-api-integration` | `~\.agents\skills\gemini-api-integration` |

> Read `gemini-api` first → then `gemini-interactions-api` for vision/video → then `gemini-api-integration` for wiring into the app.

---

#### 🎬 Video Frame Extraction
| Task | Skill | Path |
|------|-------|------|
| Extracting frames from video | `video-frames` | `~\.agents\skills\video-frames` |
| Motion/animation from video | `video-motion-graphics` | `~\.agents\skills\video-motion-graphics` |

> Read both before any code that processes the Playwright video recording.

---

#### 🎨 CSS / Design Extraction
| Task | Skill | Path |
|------|-------|------|
| Extracting design from SaaS site | `extract-saas-design` | `~\.agents\skills\extract-saas-design` |
| General design extraction | `extract-design` | `~\.agents\skills\extract-design` |
| CSS → Tailwind tokens | `converting-css-to-tailwind` | `~\.agents\skills\converting-css-to-tailwind` |

> Read `extract-saas-design` + `extract-design` together before writing `extractor.ts` or `formatter.ts`.
> Read `converting-css-to-tailwind` when formatting color/spacing output.

---

#### 📁 File Handling
| Task | Skill | Path |
|------|-------|------|
| File downloads / remote fetch | `web-fetch` | `~\.agents\skills\web-fetch` |
| File upload handling | `file-uploads` | `~\.agents\skills\file-uploads` |

---

#### ⚛️ Next.js & App Router
| Task | Skill | Path |
|------|-------|------|
| All Next.js code | `next-best-practices` | `~\.agents\skills\next-best-practices` |
| App Router patterns | `nextjs-app-router-patterns` | `~\.agents\skills\nextjs-app-router-patterns` |
| SEO | `nextjs-seo` | `~\.agents\skills\nextjs-seo` |

> Read `next-best-practices` before touching ANY file in `src/app/`.

---

#### 🎨 Frontend UI Design — READ ALL THAT APPLY
| Task | Skill | Path |
|------|-------|------|
| **Main UI components** | `frontend-design` | `~\.agents\skills\frontend-design` |
| **UX quality & patterns** | `ui-ux-pro-max` | `~\.agents\skills\ui-ux-pro-max` |
| **Premium visual quality** | `high-end-visual-design` | `~\.agents\skills\high-end-visual-design` |
| **Tailwind CSS tokens** | `tailwind-design-system` | `~\.agents\skills\tailwind-design-system` |
| **Responsive layout** | `responsive-design` | `~\.agents\skills\responsive-design` |
| **Design taste judgement** | `design-taste-frontend` | `~\.agents\skills\design-taste-frontend` |
| **Secondary taste layer** | `stitch-design-taste` | `~\.agents\skills\stitch-design-taste` |
| **Minimal/clean UI** | `minimalist-ui` | `~\.agents\skills\minimalist-ui` |
| **Homepage / landing** | `landing-page` | `~\.agents\skills\landing-page` |
| **Animations & transitions** | `animate` | `~\.agents\skills\animate` |
| **Screenshot → code** | `image-to-code` | `~\.agents\skills\image-to-code` |
| **Page layout structure** | `layout` | `~\.agents\skills\layout` |
| **Typography** | `typeset` | `~\.agents\skills\typeset` |
| **Web design rules** | `web-design-guidelines` | `~\.agents\skills\web-design-guidelines` |
| **Delight / micro-details** | `delight` | `~\.agents\skills\delight` |
| **Polish & refinement** | `polish` | `~\.agents\skills\polish` |

> For any frontend component or page, the minimum skills to read are:
> `frontend-design` + `ui-ux-pro-max` + `tailwind-design-system` + `minimalist-ui`
>
> For the homepage specifically, also read:
> `landing-page` + `design-taste-frontend` + `high-end-visual-design`
>
> For loading states and animations, also read:
> `animate` + `delight`

---

#### 🔧 General Engineering
| Task | Skill | Path |
|------|-------|------|
| API route design | `api-design-patterns` | `~\.agents\skills\api-design-patterns` |
| Node.js backend logic | `nodejs-backend-patterns` | `~\.agents\skills\nodejs-backend-patterns` |
| TypeScript patterns | `modern-javascript-patterns` | `~\.agents\skills\modern-javascript-patterns` |
| Clean code | `clean-code-principles` | `~\.agents\skills\clean-code-principles` |
| Code review | `code-review-excellence` | `~\.agents\skills\code-review-excellence` |
| Debugging | `debugging-strategies` | `~\.agents\skills\debugging-strategies` |
| Testing | `testing-best-practices` | `~\.agents\skills\testing-best-practices` |
| Design system patterns | `design-system-patterns` | `~\.agents\skills\design-system-patterns` |
| API documentation | `swagger-doc-creator` | `~\.agents\skills\swagger-doc-creator` |

---

### 🔮 Skills for Future Features (Install When Needed)
| Feature | Skill | Install Command |
|---------|-------|----------------|
| GSAP animations | `gsap-core` + `gsap-react` | `npx skills install gsap-core` |
| User auth | `nextauth-authentication` | `npx skills install nextauth-authentication` |
| Database / history | `postgresql-table-design` | `npx skills install postgresql-table-design` |
| Docker on VPS | `docker-expert` | `npx skills install docker-expert` |
| CI/CD pipeline | `cicd-automation-workflow-automate` | `npx skills install cicd-automation-workflow-automate` |
| Accessibility audit | `accessibility-compliance` | Already installed ✅ |

---

### ❌ If a Skill Is Missing
1. Run `npx skills search [keyword]`
2. If found → install it and update this file
3. If NOT found → say: *"No skill found for [task]. I will not proceed blindly. Please source a skill or explicitly authorize me."*
4. **Do not write code without a skill or explicit authorization. This is not optional.**

---

## 🔄 Full Pipeline

```
User enters URL → clicks "Extract Design"
        ↓
src/app/page.tsx (frontend)
        ↓ POST /api/extract { url }
src/app/api/extract/route.ts
        ↓ calls
src/lib/extractor.ts (Playwright)
  ├── Opens URL in headless Chromium (1440x900, --no-sandbox on VPS)
  ├── Waits for networkidle
  ├── Takes full-page screenshot → outputs/[session]/screenshot.png
  ├── Records video while:
  │     - Scrolling top to bottom slowly
  │     - Hovering over nav, buttons, cards
  │     - Waiting 500ms between interactions
  │   → videos/[session]/recording.webm
  ├── Runs page.evaluate() + getComputedStyle on all elements
  │     Extracts: colors, fonts, sizes, weights, padding, margin,
  │               border-radius, box-shadow, transitions, animations,
  │               grid/flex structure
  └── Saves → outputs/[session]/extracted.json
        ↓
src/app/api/analyze/route.ts
        ↓ calls
src/lib/analyzer.ts (Gemini)
  ├── Extracts 5 key frames from video (0%, 25%, 50%, 75%, 100%)
  ├── Sends to Gemini (temp: 0.2, model: gemini-2.0-flash):
  │     - screenshot (base64 PNG)
  │     - extracted.json content
  │     - 5 video frames (base64)
  └── Returns structured AnalysisResult JSON
        ↓
src/lib/formatter.ts
  ├── Formats → outputs/[session]/design.md
  └── Generates → outputs/[session]/prompt.md
        ↓
API Response → Frontend
  ├── Shows screenshot preview
  ├── Renders design.md preview
  ├── "Download design.md" button
  └── "Download prompt.md" + copy-to-clipboard
```

---

## 📄 Output File Formats

### design.md
```markdown
# Design System: [Site Name]
Source: [URL]
Extracted: [ISO Date]

## Brand Tone
[3–5 adjectives e.g. "minimal, confident, premium, spacious, trustworthy"]

## Color Palette
| Token          | Hex       | Usage              |
|----------------|-----------|--------------------|
| bg-primary     | #000000   | Main background    |
| text-primary   | #FFFFFF   | Headlines          |
| text-secondary | #86868B   | Body text          |
| accent         | #0071E3   | CTAs, links        |
| border-subtle  | #1D1D1F   | Card borders       |

## Typography
- Font Family: [Name] (fallback: [stack])
- Scale Ratio: [e.g. 1.25 — Major Third]
- Sizes (px): [e.g. 14 / 18 / 23 / 29 / 36 / 45 / 56 / 72]
- Body: [size]px, weight: [weight], line-height: [value]
- H1: [size]px, weight: [weight], line-height: [value]

## Spacing Scale
- Base unit: [4 or 8]px
- Scale: [e.g. 4, 8, 12, 16, 24, 32, 48, 64, 96, 128]
- Section vertical padding: [value]px

## Motion
### Page Load
- [element]: [animation, duration, easing]
### Scroll Animations
- [element]: [description]
### Hover States
- Buttons: [description]
- Cards: [description]
- Nav links: [description]
### Click / Active States
- [description]

## Layout
- Max content width: [value]px
- Grid: [columns] columns, [gap]px gap
- Breakpoints: [values]

## Component Patterns
- Cards: [radius, shadow, border]
- Buttons: [shape, padding, style]
- Navigation: [sticky/fixed, blur, border]
```

### prompt.md
```markdown
You are building a website that matches the following design system exactly.
Read every rule below before writing any code.

[Full design.md contents inserted here]

## What to Build
[Sections to build]

## Non-Negotiable Rules
- Use EXACTLY the spacing scale — never approximate
- Use EXACTLY the typography scale — font sizes must match
- Every interactive element MUST have hover, active, and focus states
- Implement the full motion vocabulary defined above
- Empty space is intentional — do not fill it
- Output complete, production-ready code only
```

---

## 🌐 API Reference

### POST /api/extract
```typescript
// Request
{ url: string }

// Response
{
  success: boolean
  sessionId: string        // e.g. "1716800000000-apple-com"
  screenshotPath: string
  extractedDataPath: string
  videoPath: string
  error?: string
}
```

### POST /api/analyze
```typescript
// Request
{
  sessionId: string
  model?: "gemini-2.0-flash" | "gemini-2.5-flash"
}

// Response
{
  success: boolean
  designMdPath: string
  promptMdPath: string
  preview: string          // First 500 chars of design.md
  error?: string
}
```

### GET /api/download?sessionId=x&file=design
Returns file as download with correct Content-Disposition headers.
`file` param: `"design"` | `"prompt"`

---

## 🎨 UI/UX Rules

- **Theme:** Dark mode first, clean, minimal, premium feel
- **Above the fold:** Large URL input + "Extract Design" button only — nothing else
- **Loading:** Step-by-step progress, never a generic spinner:
  ```
  ⏳ Step 1: Opening site...
  ⏳ Step 2: Extracting CSS...
  ⏳ Step 3: Recording interactions...
  ⏳ Step 4: Analyzing with AI...
  ✅ Done!
  ```
- **Results:** Split view — screenshot left | design.md preview right
- **Downloads:** Two prominent buttons + copy-to-clipboard for prompt.md
- **Errors:** Human-readable only — never show stack traces or raw errors
- **Mobile:** Responsive but desktop-first (power users on desktop)
- **Whitespace:** Generous — do not pack elements tightly
- **Typography:** One font family, clear hierarchy, no decorative fonts

---

## ⚙️ Playwright Rules

> Read `playwright-best-practices` + `playwright-scraper` before touching `src/lib/extractor.ts`.

- Browser: **Chromium only**
- Viewport: **1440x900**
- Wait: **networkidle** before screenshot
- VPS flag: `--no-sandbox` always (Linux server requirement — handled in extractor.ts)
- Video simulation:
  1. `page.goto(url)` → wait networkidle
  2. Scroll top → bottom at 200px/step with 100ms delay
  3. `page.mouse.move()` over nav links, buttons, cards
  4. 500ms pause between interactions
  5. `context.close()` to save video
- CSS properties to extract per element: `color`, `background-color`, `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `padding`, `margin`, `border-radius`, `box-shadow`, `transition`, `animation`, `display`, `grid-template-columns`, `gap`, `flex-direction`
- Video frames: 5 frames at 0%, 25%, 50%, 75%, 100%
- Timeout: **30 seconds** hard limit — fail gracefully
- Always wrap in `try/finally` — browser MUST close even on error

---

## 🤖 Gemini AI Rules

> Read `gemini-api` + `gemini-interactions-api` + `gemini-api-integration` before touching `src/lib/analyzer.ts`.

- Default model: `gemini-2.0-flash` (free tier — use during development)
- Production model: `gemini-2.5-flash` (better video understanding)
- Temperature: `0.2`
- Max output tokens: `4096`
- Send order: screenshot → extracted JSON → video frames
- Always request JSON output matching `AnalysisResult` in `src/types/analysis.ts`
- Validate JSON before saving — reject and retry once if malformed
- Rate limit: exponential backoff on 429 — 2s, 4s, 8s then fail with message
- API key: server-side only — never in client components or `NEXT_PUBLIC_*`
- Fallback: If Gemini fails after retries → try Qwen2.5-VL via OpenRouter

---

## 🚀 VPS Deployment

### Architecture
```
VPS Ubuntu 22.04
├── Nginx :80/:443
│   └── → Next.js :3000
├── PM2 (auto-restart, persist across reboots)
├── Playwright Chromium (system install)
└── Node.js 20.x LTS
```

### First-Time Setup
```bash
git clone [repo] && cd designdna
cp .env.example .env.local          # fill in API keys
npm install
npx playwright install chromium
npx playwright install-deps chromium
mkdir -p outputs videos
chmod 755 outputs videos
npm run build
pm2 start npm --name "designdna" -- start
pm2 save
pm2 startup
```

### Routine Deployment
```bash
git pull origin main
npm install
npm run build
pm2 restart designdna
```

### Nginx Config
`/etc/nginx/sites-available/designdna`
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    proxy_read_timeout 120s;
    proxy_connect_timeout 120s;
    proxy_send_timeout 120s;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Cron — Auto-clean Old Files
```bash
# Add via: crontab -e
0 3 * * * find /path/to/designdna/outputs -type d -mtime +1 -exec rm -rf {} + 2>/dev/null
0 3 * * * find /path/to/designdna/videos -type f -mtime +1 -delete 2>/dev/null
```

---

## 📦 NPM Scripts
```json
{
  "dev":           "next dev",
  "build":         "next build",
  "start":         "next start",
  "lint":          "next lint",
  "type-check":    "tsc --noEmit",
  "clean-outputs": "rm -rf outputs/* videos/*"
}
```

---

## 🔒 Security Rules

- **API keys server-side only** — never in client components, never `NEXT_PUBLIC_*`
- **URL validation** — block `localhost`, `127.x.x.x`, `192.168.x.x`, `10.x.x.x`, `0.0.0.0` (SSRF prevention)
- **Rate limiting** — max 10 extractions per IP per hour
- **Output validation** — validate AI JSON against TypeScript types before saving
- **No raw errors to client** — always return user-friendly messages
- **CORS** — same-origin only

---

## 🐛 Known Issues & TODOs

> `[TODO]` = not yet built. Do not assume it exists.

- `[TODO]` Rate limiting in API routes
- `[TODO]` Cron job on VPS
- `[TODO]` Qwen2.5-VL fallback when Gemini quota exceeded
- `[TODO]` User-customizable extraction scope
- `[TODO]` Copy-to-clipboard on mobile
- `[TODO]` Accessibility pass before public launch
- `[KNOWN BUG]` Playwright fails silently on Cloudflare-protected sites — use `playwright-bot-bypass` skill when addressing, show clean user error
- `[KNOWN LIMIT]` Login-required sites out of scope

---

## 🤝 Working on This Project

### AI Agent Checklist — Before Every Task
- [ ] Read `AGENTS.md` completely
- [ ] Identify which skills apply
- [ ] Read those skills completely
- [ ] No skill found → report it, do NOT proceed blindly
- [ ] Confirm you understand the task
- [ ] TypeScript only — no `.js` files
- [ ] Follow all conventions in this file
- [ ] Update `AGENTS.md` if adding new patterns or dependencies

### Human Developer Setup
```bash
git clone [repo]
cp .env.example .env.local
npm install
npx playwright install chromium
npm run dev                    # → http://localhost:3000
```

### Git Conventions
- Branches: `feature/[description]` or `fix/[description]`
- Commits: `feat:` `fix:` `chore:` `docs:` `refactor:`
- Never commit: `.env.local`, `outputs/`, `videos/`, `node_modules/`

---

## 📞 Troubleshooting

| Problem | Action |
|---------|--------|
| No skill for a task | `npx skills search [keyword]` → install → update AGENTS.md |
| Unclear requirements | Ask before writing code |
| Playwright fails on VPS | Verify `--no-sandbox`, run `npx playwright install-deps chromium` |
| Gemini returns bad JSON | Lower temp to 0.1, add stricter JSON format instructions |
| Site blocks Playwright | Use `playwright-bot-bypass` skill, show clean error if still blocked |
| TypeScript errors | Run `npm run type-check`, check `src/types/` first |
| Output files missing | Check `OUTPUT_DIR` in `.env.local`, check folder permissions |
| App crashes on VPS | `pm2 logs designdna` — check actual error |

---

*This file is the law of this project.*
*When in doubt, come back here before doing anything.*
*Last updated: May 2026 — Update this date when you modify this file.*
