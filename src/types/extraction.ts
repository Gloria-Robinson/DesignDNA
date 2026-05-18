export type CSSPropertyMap = {
  color: string;
  backgroundColor: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  padding: string;
  margin: string;
  borderRadius: string;
  boxShadow: string;
  transition: string;
  animation: string;
  display: string;
  gridTemplateColumns: string;
  gap: string;
  flexDirection: string;
};

export type ElementData = {
  selector: string;
  tagName: string;
  properties: CSSPropertyMap;
};

export type LogoImage = {
  src: string;
  alt: string;
  context: string; // which section it came from (nav, press, footer, etc.)
};

export type ExtractedCSS = {
  url: string;
  timestamp: string;
  viewport: { width: 1440; height: 900 };
  elements: ElementData[];
  colorPalette: string[];
  fontFamilies: string[];
  spacingValues: string[];
  animationTokens: string[];
  logoImages: LogoImage[];
};

export type ExtractionResult = {
  success: boolean;
  sessionId: string;
  screenshotPath: string;
  extractedDataPath: string;
  videoPath: string;
  framePaths: string[];
  error?: string;
};
