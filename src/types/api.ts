import type { ExtractionResult } from './extraction';

export type ExtractRequest = {
  url: string;
};

export type ExtractResponse = ExtractionResult;

export type AnalyzeRequest = {
  sessionId: string;
  model?: 'gemini-2.0-flash' | 'gemini-2.5-flash';
};

export type AnalyzeResponse = {
  success: boolean;
  sessionId: string;
  designMdPath: string;
  promptMdPath: string;
  preview: string;
  error?: string;
};

export type DownloadFile = 'design' | 'prompt' | 'screenshot';

export type ProgressStep = {
  step: number;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
};
