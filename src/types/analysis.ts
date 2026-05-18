export type ColorToken = {
  token: string;
  hex: string;
  usage: string;
};

export type TypographySpec = {
  fontFamily: string;
  fallback: string;
  scaleRatio: string;
  sizes: number[];
  body: { size: number; weight: number; lineHeight: string };
  h1: { size: number; weight: number; lineHeight: string };
  h2?: { size: number; weight: number; lineHeight: string };
  h3?: { size: number; weight: number; lineHeight: string };
  letterSpacing?: string;
};

export type MotionSpec = {
  pageLoad: Array<{ element: string; animation: string; duration: string; easing: string }>;
  scroll: Array<{ element: string; description: string }>;
  hover: { buttons: string; cards: string; navLinks: string };
  click: string;
};

export type LayoutSpec = {
  maxContentWidth: number;
  gridColumns: number;
  gridGap: number;
  breakpoints: string[];
};

export type ComponentPatterns = {
  cards: { radius: string; shadow: string; border: string };
  buttons: { shape: string; padding: string; style: string };
  navigation: { position: string; blur: boolean; border: string };
  badges?: { shape: string; padding: string; style: string };
  inputs?: { radius: string; border: string; background: string };
};

export type GradientToken = {
  name: string;
  value: string;
  usage: string;
};

export type BackgroundEffect = {
  type: string;
  value: string;
  effect: string;
};

export type DesignSystem = {
  siteName: string;
  sourceUrl: string;
  brandTone: string[];
  colors: ColorToken[];
  gradients?: GradientToken[];
  background?: BackgroundEffect;
  typography: TypographySpec;
  spacing: { baseUnit: number; scale: number[]; sectionPadding: number };
  motion: MotionSpec;
  layout: LayoutSpec;
  components: ComponentPatterns;
};

export type AnalysisResult = {
  success: boolean;
  designSystem: DesignSystem;
  modelUsed?: string;
  rawResponse?: string;
  error?: string;
};
