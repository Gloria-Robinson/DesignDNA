import type { DesignSystem } from '@/types/analysis';

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildCssVars(system: DesignSystem): string {
  const colorVars = system.colors
    .map(c => `  --color-${c.token}: ${c.hex};`)
    .join('\n');

  const h2Size = system.typography.h2?.size ?? Math.round(system.typography.h1.size * 0.7);
  const h3Size = system.typography.h3?.size ?? Math.round(system.typography.h1.size * 0.5);
  const buttonRadius =
    system.components.buttons.shape === 'rounded-full'
      ? '9999px'
      : system.components.cards.radius;

  return `:root {
  /* Colors */
${colorVars}

  /* Typography */
  --font-sans: "${system.typography.fontFamily}", ${system.typography.fallback};
  --text-h1: ${system.typography.h1.size}px;
  --text-h2: ${h2Size}px;
  --text-h3: ${h3Size}px;
  --text-body: ${system.typography.body.size}px;
  --leading-heading: ${system.typography.h1.lineHeight};
  --leading-body: ${system.typography.body.lineHeight};
  --tracking-heading: ${system.typography.letterSpacing ?? '-0.02em'};

  /* Spacing */
  --spacing-base: ${system.spacing.baseUnit}px;
  --spacing-section: ${system.spacing.sectionPadding}px;

  /* Layout */
  --max-width: ${system.layout.maxContentWidth}px;
  --grid-gap: ${system.layout.gridGap}px;

  /* Components */
  --radius-card: ${system.components.cards.radius};
  --radius-button: ${buttonRadius};
  --shadow-card: ${system.components.cards.shadow};
  --border-card: ${system.components.cards.border};
}`;
}

function isDarkColor(hex: string): boolean {
  const h = hex.replace('#', '');
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
}

function googleFontUrl(fontFamily: string): string {
  const known: Record<string, string> = {
    inter: 'Inter:wght@300;400;500;600;700',
    poppins: 'Poppins:wght@300;400;500;600;700',
    roboto: 'Roboto:wght@300;400;500;700',
    'plus jakarta sans': 'Plus+Jakarta+Sans:wght@300;400;500;600;700',
    outfit: 'Outfit:wght@300;400;500;600;700',
    manrope: 'Manrope:wght@300;400;500;600;700',
    raleway: 'Raleway:wght@300;400;500;600;700',
    nunito: 'Nunito:wght@300;400;500;600;700',
    lato: 'Lato:wght@300;400;700',
    montserrat: 'Montserrat:wght@300;400;500;600;700',
    'dm sans': 'DM+Sans:wght@300;400;500;600;700',
    'space grotesk': 'Space+Grotesk:wght@300;400;500;600;700',
    figtree: 'Figtree:wght@300;400;500;600;700',
    'work sans': 'Work+Sans:wght@300;400;500;600;700',
  };
  const key = Object.keys(known).find(k => fontFamily.toLowerCase().includes(k));
  const param = key ? known[key] : `${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700`;
  return `https://fonts.googleapis.com/css2?family=${param}&display=swap`;
}

// ── design.md ─────────────────────────────────────────────────────────────────

type LogoImage = { src: string; alt: string; context: string };

export function formatDesignMd(system: DesignSystem, sourceUrl: string, logoImages: LogoImage[] = []): string {
  const colorTable = system.colors
    .map(c => `| ${c.token.padEnd(18)} | \`${c.hex}\` | ${c.usage} |`)
    .join('\n');

  const gradientsSection = system.gradients?.length
    ? `## Gradients\n| Name | CSS Value | Usage |\n|------|-----------|-------|\n${system.gradients
        .map(g => `| ${g.name} | \`${g.value}\` | ${g.usage} |`)
        .join('\n')}\n\n`
    : '';

  const backgroundSection = system.background
    ? `## Background Effect\n- Type: ${system.background.type}\n- Description: ${system.background.effect}\n\`\`\`css\n.hero-section {\n  background: ${system.background.value};\n}\n\`\`\`\n\n`
    : '';

  const h2Line = system.typography.h2
    ? `- H2: \`${system.typography.h2.size}px\`, weight: ${system.typography.h2.weight}, line-height: ${system.typography.h2.lineHeight}\n`
    : '';
  const h3Line = system.typography.h3
    ? `- H3: \`${system.typography.h3.size}px\`, weight: ${system.typography.h3.weight}, line-height: ${system.typography.h3.lineHeight}\n`
    : '';
  const letterSpacingLine = system.typography.letterSpacing
    ? `- Letter Spacing (headings): \`${system.typography.letterSpacing}\`\n`
    : '';
  const badgesLine = system.components.badges
    ? `- Badges/Pills: ${system.components.badges.shape}, padding \`${system.components.badges.padding}\`, ${system.components.badges.style}\n`
    : '';
  const inputsLine = system.components.inputs
    ? `- Inputs: radius \`${system.components.inputs.radius}\`, border \`${system.components.inputs.border}\`, bg \`${system.components.inputs.background}\`\n`
    : '';

  const motionPageLoad = system.motion.pageLoad
    .map(m => `- **${m.element}**: ${m.animation}, ${m.duration}, ${m.easing}`)
    .join('\n');
  const motionScroll = system.motion.scroll
    .map(m => `- **${m.element}**: ${m.description}`)
    .join('\n');

  return `# Design System: ${system.siteName}
Source: ${sourceUrl}
Extracted: ${new Date().toISOString()}

## Brand Tone
${system.brandTone.join(', ')}

## CSS Custom Properties
\`\`\`css
${buildCssVars(system)}
\`\`\`

## Color Palette
| Token              | Hex       | Usage              |
|--------------------|-----------|--------------------|
${colorTable}

${gradientsSection}${backgroundSection}## Typography
- Font Family: **${system.typography.fontFamily}** (fallback: ${system.typography.fallback})
- Scale Ratio: ${system.typography.scaleRatio}
- Sizes (px): ${system.typography.sizes.join(' / ')}
- Body: \`${system.typography.body.size}px\`, weight: ${system.typography.body.weight}, line-height: ${system.typography.body.lineHeight}
- H1: \`${system.typography.h1.size}px\`, weight: ${system.typography.h1.weight}, line-height: ${system.typography.h1.lineHeight}
${h2Line}${h3Line}${letterSpacingLine}
## Spacing Scale
- Base unit: ${system.spacing.baseUnit}px
- Scale: ${system.spacing.scale.join(', ')}
- Section vertical padding: ${system.spacing.sectionPadding}px

## Motion
### Page Load
${motionPageLoad || '- No page load animations detected'}
### Scroll Animations
${motionScroll || '- No scroll animations detected'}
### Hover States
- Buttons: ${system.motion.hover.buttons}
- Cards: ${system.motion.hover.cards}
- Nav links: ${system.motion.hover.navLinks}
### Click / Active States
- ${system.motion.click}

## Layout
- Max content width: ${system.layout.maxContentWidth}px
- Grid: ${system.layout.gridColumns} columns, ${system.layout.gridGap}px gap
- Breakpoints: ${system.layout.breakpoints.join(' / ')}

## Component Patterns
- Cards: radius \`${system.components.cards.radius}\`, shadow \`${system.components.cards.shadow}\`, border \`${system.components.cards.border}\`
- Buttons: ${system.components.buttons.shape}, padding \`${system.components.buttons.padding}\`, ${system.components.buttons.style}
- Navigation: ${system.components.navigation.position}${system.components.navigation.blur ? ', backdrop-blur' : ''}, border \`${system.components.navigation.border}\`
${badgesLine}${inputsLine}${logoImages.length > 0 ? `\n## Image Assets\nThese are real image URLs scraped from the page — use them exactly as-is in \`<img>\` tags:\n\n${logoImages.map(l => `- **${l.alt || 'image'}** (${l.context}): \`${l.src}\``).join('\n')}\n` : ''}`;
}

// ── prompt.md ─────────────────────────────────────────────────────────────────

export function formatPromptMd(system: DesignSystem, designMd: string, logoImages: LogoImage[] = []): string {
  const bgHex = system.colors.find(c => c.token.includes('bg'))?.hex ?? '#ffffff';
  const textHex = system.colors.find(c => c.token.includes('text-primary'))?.hex ?? (isDarkColor(bgHex) ? '#ffffff' : '#111111');
  const accentHex = system.colors.find(c => c.token.includes('accent') && !c.token.includes('secondary'))?.hex ?? '#0066ff';
  const surfaceHex = system.colors.find(c => c.token.includes('surface'))?.hex;
  const borderHex = system.colors.find(c => c.token.includes('border'))?.hex;
  const secondaryTextHex = system.colors.find(c => c.token.includes('text-secondary'))?.hex;

  const dark = isDarkColor(bgHex);
  const hasGlass = system.components.navigation.blur;
  const hasBadge = !!system.components.badges;
  const hasGradientBg = !!system.background;
  const hasEntranceAnim = system.motion.pageLoad.length > 0;
  const h2Size = system.typography.h2?.size ?? Math.round(system.typography.h1.size * 0.7);
  const h3Size = system.typography.h3?.size ?? Math.round(system.typography.h1.size * 0.5);
  const tracking = system.typography.letterSpacing ?? '-0.02em';
  const fontUrl = googleFontUrl(system.typography.fontFamily);
  const btnShape = system.components.buttons.shape === 'rounded-full' ? 'rounded-full' : `rounded-[${system.components.cards.radius}]`;
  const btnPad = system.components.buttons.padding;
  const cardRadius = system.components.cards.radius;
  const sectionPad = system.spacing.sectionPadding;
  const maxW = system.layout.maxContentWidth;
  const gridGap = system.layout.gridGap;
  const gradientText = system.gradients?.find(g => g.usage.toLowerCase().includes('text') || g.usage.toLowerCase().includes('heading'));
  const heroBg = system.background?.value ?? bgHex;

  // ── CSS utilities block ────────────────────────────────────────────────
  const glassUtility = hasGlass ? `
/* Liquid Glass — copy exactly */
.liquid-glass {
  background: rgba(${dark ? '255,255,255,0.04' : '0,0,0,0.03'});
  backdrop-filter: blur(12px) saturate(1.4);
  -webkit-backdrop-filter: blur(12px) saturate(1.4);
  position: relative;
  overflow: hidden;
}
.liquid-glass::before {
  content: "";
  position: absolute; inset: 0;
  border-radius: inherit;
  padding: 1.2px;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.12) 20%,
    transparent 40%, transparent 60%,
    rgba(255,255,255,0.12) 80%, rgba(255,255,255,0.35) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
.liquid-glass-strong {
  background: rgba(${dark ? '255,255,255,0.07' : '0,0,0,0.06'});
  backdrop-filter: blur(40px) saturate(1.8);
  -webkit-backdrop-filter: blur(40px) saturate(1.8);
}` : '';

  const gradientTextUtility = gradientText ? `
/* Gradient headline text */
.gradient-text {
  background: ${gradientText.value};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}` : '';

  const bgEffectUtility = hasGradientBg ? `
/* Hero background mesh */
.hero-bg {
  background: ${heroBg};
}` : '';

  // ── Tailwind config ────────────────────────────────────────────────────
  const colorTokens = system.colors
    .map(c => `      '${c.token}': '${c.hex}',`)
    .join('\n');

  const twConfig = `tailwind.config = {
  theme: {
    extend: {
      colors: {
${colorTokens}
      },
      fontFamily: {
        heading: ['"${system.typography.fontFamily}"', '${system.typography.fallback}'],
        body:    ['"${system.typography.fontFamily}"', '${system.typography.fallback}'],
      },
      letterSpacing: { heading: '${tracking}' },
      maxWidth:      { content: '${maxW}px' },
      borderRadius:  { card: '${cardRadius}', btn: '${btnShape === 'rounded-full' ? '9999px' : cardRadius}' },
    },
  },
};`;

  // ── Animation variants ─────────────────────────────────────────────────
  const animBlock = hasEntranceAnim ? `
## Animations

### Framer Motion — copy-paste ready
\`\`\`tsx
import { motion } from 'framer-motion';

// Reusable variants — no TypeScript errors
const fadeUp = {
  hidden:  { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)',
             transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } },
};

// Wrap section content — each child gets staggered automatically:
// <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
//   <motion.h1  variants={fadeUp}>Headline</motion.h1>
//   <motion.p   variants={fadeUp}>Body text</motion.p>
//   <motion.div variants={fadeUp}>CTAs</motion.div>
// </motion.div>

// For a custom per-item delay, override transition inline:
// <motion.div variants={fadeUp} transition={{ delay: 0.3 }}>...</motion.div>
\`\`\`

### CSS-only fallback (no framework needed)
\`\`\`css
.reveal {
  opacity: 0;
  transform: translateY(20px);
  filter: blur(6px);
  transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1),
              transform 0.6s cubic-bezier(0.16,1,0.3,1),
              filter 0.5s ease;
}
.reveal.visible { opacity: 1; transform: translateY(0); filter: none; }
/* Stagger: add [style="transition-delay: Xms"] to each child */
\`\`\`
\`\`\`javascript
const io = new IntersectionObserver(
  entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
  { threshold: 0.15 }
);
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
\`\`\`` : '';

  // ── Nav JSX ─────────────────────────────────────────────────────────────
  const navPosition = system.components.navigation.position === 'fixed' ? 'fixed top-0 left-0 right-0 z-50' : 'sticky top-0 z-50';
  const navBg = hasGlass
    ? `className="${navPosition} ${hasGlass ? 'liquid-glass' : ''} flex items-center justify-between px-6 lg:px-12 h-16 border-b"
        style={{ borderColor: '${borderHex ?? 'rgba(255,255,255,0.08)'}' }}`
    : `className="${navPosition} flex items-center justify-between px-6 lg:px-12 h-16"
        style={{ background: '${bgHex}', borderBottom: '${system.components.navigation.border}' }}`;

  // ── Hero JSX ─────────────────────────────────────────────────────────────
  const badgeJSX = hasBadge
    ? `
      {/* Announcement badge */}
      <div className="${hasGlass ? 'liquid-glass' : 'border border-white/20'} ${system.components.badges?.shape ?? 'rounded-full'} inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-sm font-medium"
           style={{ color: '${textHex}90' }}>
        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '${accentHex}' }} />
        Your announcement text here
      </div>`
    : '';

  const gradientHeadlineJSX = gradientText
    ? `      {/* Headline — accent word gets gradient text */}
      <h1 style={{ fontSize: 'clamp(${Math.round(system.typography.h1.size * 0.6)}px, 6vw, ${system.typography.h1.size}px)', fontWeight: ${system.typography.h1.weight}, lineHeight: '${system.typography.h1.lineHeight}', letterSpacing: '${tracking}', color: '${textHex}' }}
          className="font-heading mb-6 max-w-3xl mx-auto text-center">
        Your headline here.{' '}
        <span className="gradient-text">Accent phrase.</span>
      </h1>`
    : `      {/* Headline */}
      <h1 style={{ fontSize: 'clamp(${Math.round(system.typography.h1.size * 0.6)}px, 6vw, ${system.typography.h1.size}px)', fontWeight: ${system.typography.h1.weight}, lineHeight: '${system.typography.h1.lineHeight}', letterSpacing: '${tracking}', color: '${textHex}' }}
          className="font-heading mb-6 max-w-3xl mx-auto text-center">
        Your compelling headline here.
      </h1>`;

  return `# Build Prompt: ${system.siteName}

> **Note:** A \`design.md\` file accompanies this prompt with the complete CSS token map. Drop **both files** into your AI tool — this file gives the implementation blueprint, \`design.md\` gives the exact values.

**Visual style:** ${[dark ? 'dark background' : 'light background', hasGlass ? 'liquid glass UI' : 'flat UI', hasGradientBg ? 'gradient mesh background' : '', gradientText ? 'gradient headline text' : '', hasEntranceAnim ? 'entrance animations' : ''].filter(Boolean).join(' · ')}
**Brand:** ${system.brandTone.join(', ')}
**Source:** ${system.sourceUrl}

---

## Tech Stack

\`\`\`html
<!-- Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="${fontUrl}" rel="stylesheet">

<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Framer Motion (optional — for entrance animations) -->
<script src="https://unpkg.com/framer-motion@11/dist/framer-motion.js"></script>
<script>window.Motion = window.FramerMotion;</script>
\`\`\`

**npm alternative:**
\`\`\`
npm install tailwindcss framer-motion
\`\`\`

---

## Tailwind Config

\`\`\`javascript
${twConfig}
\`\`\`

---

## CSS Utilities

\`\`\`css
/* 1. Font import */
@import url('${fontUrl}');

/* 2. Design tokens */
${buildCssVars(system)}
${glassUtility}
${gradientTextUtility}
${bgEffectUtility}
/* Section + container defaults */
.section    { padding: ${sectionPad}px 0; }
.container  { max-width: ${maxW}px; margin: 0 auto; padding: 0 24px; }
\`\`\`

---

## Navigation

\`\`\`jsx
<nav ${navBg}>
  {/* Logo */}
  <a href="/" className="font-heading font-semibold text-lg tracking-tight"
     style={{ color: '${textHex}' }}>
    ${system.siteName}
  </a>

  {/* Links */}
  <div className="${hasGlass ? 'hidden md:flex liquid-glass rounded-full px-2 py-1.5 items-center gap-1' : 'hidden md:flex items-center gap-8'}">
    {['Features', 'Pricing', 'Docs', 'Blog'].map(l => (
      <a key={l} href="#"
         className="px-3 py-2 text-sm font-medium transition-opacity hover:opacity-100"
         style={{ color: '${secondaryTextHex ?? textHex + '80'}' }}>
        {l}
      </a>
    ))}
  </div>

  {/* Primary CTA */}
  <button className="${btnShape} text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ padding: '${btnPad}', background: '${accentHex}', color: '${dark ? '#000' : '#fff'}' }}>
    Get Started
  </button>
</nav>
\`\`\`

---

## Hero Section

\`\`\`jsx
<section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden text-center px-4">

  {/* Background */}
  <div className="absolute inset-0 -z-10" style={{ background: '${heroBg}' }} />
${system.background ? `  {/* Gradient mesh overlay */}
  <div className="absolute inset-0 -z-10 pointer-events-none"
       style={{ background: '${system.background.value}' }} />` : ''}

  <div style={{ maxWidth: '${maxW}px', width: '100%', margin: '0 auto' }}>
${badgeJSX}

${gradientHeadlineJSX}

    {/* Subheading */}
    <p className="font-body font-light mx-auto mb-10 max-w-xl"
       style={{ fontSize: '${system.typography.body.size}px', lineHeight: '${system.typography.body.lineHeight}', color: '${secondaryTextHex ?? textHex + '80'}' }}>
      Your value proposition — one or two sentences. Who it's for, what it solves.
    </p>

    {/* CTA buttons */}
    <div className="flex items-center justify-center gap-4 flex-wrap">
      <button className="${btnShape} font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ padding: '${btnPad}', background: '${accentHex}', color: '${dark ? '#000' : '#fff'}' }}>
        Primary Action →
      </button>
      <button className="${hasGlass ? 'liquid-glass ' : ''}${btnShape} font-medium text-sm transition-all hover:opacity-80"
              style={{ padding: '${btnPad}', color: '${textHex}',${!hasGlass ? ` border: '1px solid ${borderHex ?? textHex + '30'}',` : ''} }}>
        Secondary Action
      </button>
    </div>
  </div>
</section>
\`\`\`

---

## Feature Cards Section

\`\`\`jsx
const features = [
  { title: 'Feature One',   desc: 'What it does and why it matters — one or two sentences.' },
  { title: 'Feature Two',   desc: 'What it does and why it matters — one or two sentences.' },
  { title: 'Feature Three', desc: 'What it does and why it matters — one or two sentences.' },
];

<section className="section" style={{ background: '${surfaceHex ?? bgHex}' }}>
  <div className="container">

    {/* Section header */}
    <div className="text-center mb-16">
      <h2 className="font-heading mb-4"
          style={{ fontSize: '${h2Size}px', fontWeight: ${system.typography.h2?.weight ?? system.typography.h1.weight}, lineHeight: '${system.typography.h2?.lineHeight ?? '1.1'}', letterSpacing: '${tracking}', color: '${textHex}' }}>
        Section Heading
      </h2>
      <p style={{ fontSize: '${system.typography.body.size}px', color: '${secondaryTextHex ?? textHex + '70'}' }}>
        Section subheading — context or value statement.
      </p>
    </div>

    {/* Card grid */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '${gridGap}px' }}>
      {features.map((f, i) => (
        <div key={i}
             className="${hasGlass ? 'liquid-glass' : ''} transition-transform hover:-translate-y-1"
             style={{ borderRadius: '${cardRadius}', border: '${system.components.cards.border}', boxShadow: '${system.components.cards.shadow}', padding: '${Math.max(...system.spacing.scale.filter(s => s <= 32))}px',${surfaceHex ? ` background: '${surfaceHex}',` : ''} }}>
          {/* Icon placeholder */}
          <div className="mb-4 w-10 h-10 rounded-lg flex items-center justify-center"
               style={{ background: '${accentHex}20', color: '${accentHex}' }}>
            {/* SVG icon here */}
          </div>

          <h3 className="font-heading mb-2"
              style={{ fontSize: '${h3Size}px', fontWeight: 600, letterSpacing: '${tracking}', color: '${textHex}' }}>
            {f.title}
          </h3>
          <p className="font-body font-light leading-relaxed"
             style={{ fontSize: '${system.typography.body.size}px', color: '${secondaryTextHex ?? textHex + '70'}' }}>
            {f.desc}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>
\`\`\`
${animBlock}
---

## Implementation Rules

### Use these exact values — no approximations
| Token | Value |
|-------|-------|
| Background | \`${bgHex}\` |
| Primary text | \`${textHex}\` |
| Accent | \`${accentHex}\` |
| H1 | \`${system.typography.h1.size}px / ${system.typography.h1.weight} weight / ${system.typography.h1.lineHeight} line-height\` |
| H2 | \`${h2Size}px / ${system.typography.h2?.weight ?? system.typography.h1.weight} weight\` |
| Letter-spacing | \`${tracking}\` on all headings |
| Section padding | \`${sectionPad}px\` top + bottom |
| Container | \`${maxW}px\` max-width, centered, \`24px\` side padding |
| Button | \`${btnShape}\`, padding \`${btnPad}\` |
| Card radius | \`${cardRadius}\` |

### Hover / interaction states — required on every element
- Buttons: ${system.motion.hover.buttons}
- Cards: ${system.motion.hover.cards}
- Nav links: ${system.motion.hover.navLinks}
- Active/click: ${system.motion.click}
- Base transition: \`transition: all 0.2s ease\`

### Never do
- Invent colors outside the token map in \`design.md\`
- Use default Tailwind color classes (blue-500, etc.)
- Skip hover/focus states on any interactive element
- Change font sizes — use the exact values above
- Add visual elements not in this spec — whitespace is intentional
${logoImages.length > 0 ? `
---

## Image Assets (real URLs — use these exactly)

These image URLs were scraped directly from the live site. Use them in \`<img src="...">\` tags — do NOT substitute placeholders, fabricate paths, or use different URLs.

${logoImages.map(l => `- **${l.alt || 'image'}** — \`${l.src}\``).join('\n')}
` : ''}`;
}
