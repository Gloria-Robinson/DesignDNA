import type { DesignSystem } from '@/types/analysis';

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

export function formatDesignMd(system: DesignSystem, sourceUrl: string): string {
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
    ? `- H2: ${system.typography.h2.size}px, weight: ${system.typography.h2.weight}, line-height: ${system.typography.h2.lineHeight}\n`
    : '';
  const h3Line = system.typography.h3
    ? `- H3: ${system.typography.h3.size}px, weight: ${system.typography.h3.weight}, line-height: ${system.typography.h3.lineHeight}\n`
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

  const breakpoints = system.layout.breakpoints.join(' / ');
  const spacingScale = system.spacing.scale.join(', ');
  const typographySizes = system.typography.sizes.join(' / ');

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
- Sizes (px): ${typographySizes}
- Body: \`${system.typography.body.size}px\`, weight: ${system.typography.body.weight}, line-height: ${system.typography.body.lineHeight}
- H1: \`${system.typography.h1.size}px\`, weight: ${system.typography.h1.weight}, line-height: ${system.typography.h1.lineHeight}
${h2Line}${h3Line}${letterSpacingLine}
## Spacing Scale
- Base unit: ${system.spacing.baseUnit}px
- Scale: ${spacingScale}
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
- Breakpoints: ${breakpoints}

## Component Patterns
- Cards: radius \`${system.components.cards.radius}\`, shadow \`${system.components.cards.shadow}\`, border \`${system.components.cards.border}\`
- Buttons: ${system.components.buttons.shape}, padding \`${system.components.buttons.padding}\`, ${system.components.buttons.style}
- Navigation: ${system.components.navigation.position}${system.components.navigation.blur ? ', backdrop-blur' : ''}, border \`${system.components.navigation.border}\`
${badgesLine}${inputsLine}`;
}

export function formatPromptMd(system: DesignSystem, designMd: string): string {
  const cssVars = buildCssVars(system);

  const bgColor = system.colors.find(c => c.token.includes('bg') || c.token.includes('background'))?.hex ?? '#ffffff';
  const textColor = system.colors.find(c => c.token.includes('text-primary'))?.hex ?? '#000000';
  const accentColor = system.colors.find(c => c.token.includes('accent') || c.token.includes('cta') || c.token.includes('brand'))?.hex ?? '#0000ff';

  const gradientSnippet = system.gradients?.length
    ? `\n## Exact Gradient Values — use these verbatim\n${system.gradients
        .map(g => `- **${g.name}** (${g.usage}):\n  \`\`\`css\n  background: ${g.value};\n  \`\`\``)
        .join('\n')}\n`
    : '';

  const backgroundSnippet = system.background
    ? `\n## Hero Background — paste this CSS exactly\n\`\`\`css\n.hero-section {\n  background: ${system.background.value};\n}\n\`\`\`\n*${system.background.effect}*\n`
    : '';

  const h2Spec = system.typography.h2
    ? `- H2: \`font-size: ${system.typography.h2.size}px; font-weight: ${system.typography.h2.weight}; line-height: ${system.typography.h2.lineHeight};\`\n`
    : '';
  const h3Spec = system.typography.h3
    ? `- H3: \`font-size: ${system.typography.h3.size}px; font-weight: ${system.typography.h3.weight}; line-height: ${system.typography.h3.lineHeight};\`\n`
    : '';
  const letterSpacingSpec = system.typography.letterSpacing
    ? `- Heading letter-spacing: \`${system.typography.letterSpacing}\` — apply to all h1/h2/h3\n`
    : '';

  const badgeSpec = system.components.badges
    ? `\n### Badges / Announcement pills\n- Shape: \`${system.components.badges.shape}\`\n- Padding: \`${system.components.badges.padding}\`\n- Style: ${system.components.badges.style}\n`
    : '';

  return `You are building a website that matches the following design system exactly.
Read every rule below before writing any code.

> **Note:** A \`design.md\` file accompanies this prompt with the full CSS token map, color palette, gradients, and component specs. Paste both into your AI tool together for best results — this file gives the rules, design.md gives the exact values.

${designMd}

---

## CSS Setup — add to your stylesheet or :root

\`\`\`css
${cssVars}
\`\`\`
${gradientSnippet}${backgroundSnippet}
---

## Non-Negotiable Implementation Rules

### Colors
- Background: \`${bgColor}\`
- Primary text: \`${textColor}\`
- Accent: \`${accentColor}\`
- Pull every color from the CSS Custom Properties above — do not invent new colors

### Typography
- Font: **${system.typography.fontFamily}** — import via Google Fonts or CDN before use
- H1: \`font-size: ${system.typography.h1.size}px; font-weight: ${system.typography.h1.weight}; line-height: ${system.typography.h1.lineHeight};\`
${h2Spec}${h3Spec}${letterSpacingSpec}- Body: \`font-size: ${system.typography.body.size}px; font-weight: ${system.typography.body.weight}; line-height: ${system.typography.body.lineHeight};\`

### Spacing — use only these values
\`\`\`
Scale: ${system.spacing.scale.join('px, ')}px
Section padding: ${system.spacing.sectionPadding}px top + bottom
Container: max-width ${system.layout.maxContentWidth}px, centered, px-6 (24px) side padding
\`\`\`

### Buttons
- Shape: \`${system.components.buttons.shape}\` — border-radius accordingly
- Padding: \`${system.components.buttons.padding}\`
- Style: ${system.components.buttons.style}
- Hover REQUIRED: ${system.motion.hover.buttons}
- Active state: \`transform: scale(0.97)\`
${badgeSpec}
### Cards
- Border-radius: \`${system.components.cards.radius}\`
- Shadow: \`${system.components.cards.shadow}\`
- Border: \`${system.components.cards.border}\`
- Hover: ${system.motion.hover.cards}

### Navigation
- Position: \`${system.components.navigation.position}\`${system.components.navigation.blur ? '\n- Apply `backdrop-filter: blur(12px)` + semi-transparent background' : ''}
- Border: \`${system.components.navigation.border}\`

### Motion — implement for every animated element
- Page load: fade up from \`translateY(16px) opacity(0)\` → natural position over 0.5–0.7s, \`cubic-bezier(0.16, 1, 0.3, 1)\`
- Stagger list/grid items: \`animation-delay: calc(var(--i) * 80ms)\`
- Scroll entry: use IntersectionObserver — trigger same fade-up as page load
- Hover transitions baseline: \`transition: all 0.2s ease\`

### Output requirements
- Complete, production-ready code — no TODO comments, no placeholders
- Realistic copy that reflects the brand tone: **${system.brandTone.join(', ')}**
- Every interactive element needs hover, active, and focus states
- Mobile responsive — implement breakpoints: ${system.layout.breakpoints.join(', ')}
- Match section vertical padding exactly: \`${system.spacing.sectionPadding}px\`
- Never add visual elements not described above — empty space is intentional
`;
}
