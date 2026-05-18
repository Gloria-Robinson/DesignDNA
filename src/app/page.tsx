'use client';

import { useState } from 'react';
import { Palette, Type, Ruler, Zap } from 'lucide-react';
import { UrlForm } from '@/components/UrlForm';
import { LoadingState } from '@/components/LoadingState';
import { ResultPreview } from '@/components/ResultPreview';
import { DownloadButtons } from '@/components/DownloadButtons';
import type { ProgressStep, ExtractResponse, AnalyzeResponse } from '@/types/api';

type AppState = 'idle' | 'extracting' | 'analyzing' | 'done' | 'error';

const INITIAL_STEPS: ProgressStep[] = [
  { step: 1, label: 'Opening site in browser…',    status: 'pending' },
  { step: 2, label: 'Extracting CSS design tokens…', status: 'pending' },
  { step: 3, label: 'Recording interactions…',      status: 'pending' },
  { step: 4, label: 'Analyzing with AI…',           status: 'pending' },
];

function setStepStatus(steps: ProgressStep[], stepNum: number, status: ProgressStep['status']): ProgressStep[] {
  return steps.map(s => (s.step === stepNum ? { ...s, status } : s));
}

function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

export default function HomePage() {
  const [appState, setAppState]           = useState<AppState>('idle');
  const [steps, setSteps]                 = useState<ProgressStep[]>(INITIAL_STEPS);
  const [sessionId, setSessionId]         = useState<string | null>(null);
  const [designMdPreview, setDesignMdPreview] = useState('');
  const [designMdContent, setDesignMdContent] = useState('');
  const [promptMdContent, setPromptMdContent] = useState('');
  const [errorMessage, setErrorMessage]   = useState('');

  async function handleSubmit(url: string) {
    setAppState('extracting');
    setErrorMessage('');
    setSteps(prev => setStepStatus(prev, 1, 'active'));

    try {
      const extractRes  = await fetch('/api/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const extractData: ExtractResponse = await extractRes.json();
      if (!extractData.success) throw new Error(extractData.error ?? 'Extraction failed.');

      setSteps(prev => setStepStatus(prev, 1, 'done'));
      setSteps(prev => setStepStatus(prev, 2, 'active'));
      await sleep(400);
      setSteps(prev => setStepStatus(prev, 2, 'done'));
      setSteps(prev => setStepStatus(prev, 3, 'active'));
      await sleep(400);
      setSteps(prev => setStepStatus(prev, 3, 'done'));
      setSteps(prev => setStepStatus(prev, 4, 'active'));

      setSessionId(extractData.sessionId);
      setAppState('analyzing');

      const analyzeRes  = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: extractData.sessionId }) });
      const analyzeData: AnalyzeResponse = await analyzeRes.json();
      if (!analyzeData.success) throw new Error(analyzeData.error ?? 'Analysis failed.');

      setSteps(prev => setStepStatus(prev, 4, 'done'));
      setDesignMdPreview(analyzeData.preview);

      try {
        const [designRes, promptRes] = await Promise.all([
          fetch(`/api/download?sessionId=${encodeURIComponent(analyzeData.sessionId)}&file=design`),
          fetch(`/api/download?sessionId=${encodeURIComponent(analyzeData.sessionId)}&file=prompt`),
        ]);
        if (designRes.ok) setDesignMdContent(await designRes.text());
        if (promptRes.ok) setPromptMdContent(await promptRes.text());
      } catch { /* non-fatal */ }

      setAppState('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setErrorMessage(msg);
      setSteps(prev => { const a = prev.find(s => s.status === 'active'); return a ? setStepStatus(prev, a.step, 'error') : prev; });
      setAppState('error');
    }
  }

  function handleReset() {
    setAppState('idle'); setSteps(INITIAL_STEPS);
    setSessionId(null); setDesignMdPreview(''); setDesignMdContent(''); setPromptMdContent(''); setErrorMessage('');
  }

  const isLoading = appState === 'extracting' || appState === 'analyzing';

  return (
    <main className="relative w-full h-screen overflow-hidden">

      {/* ── Video background ──────────────────────────── */}
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      >
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260429_115139_0fc6bd3d-3631-4d26-ab9b-28293887dcc9.mp4" type="video/mp4" />
      </video>
      {/* Dark scrim — ensures text is readable everywhere on the frame */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      {/* ── Two-panel layout ──────────────────────────── */}
      <div className="relative flex h-screen" style={{ zIndex: 10 }}>

        {/* ── LEFT PANEL ──────────────────────────────── */}
        <div className="relative w-full lg:w-[52%] flex flex-col h-screen p-4 lg:p-6">

          {/* Glass layer */}
          <div className="liquid-glass-strong absolute inset-4 lg:inset-6 rounded-3xl" style={{ zIndex: 0 }} />

          {/* Content */}
          <div className="relative flex flex-col h-full overflow-hidden" style={{ zIndex: 2 }}>

            {/* Nav */}
            <nav className="flex items-center justify-between px-6 pt-6 pb-2">
              <div className="flex items-center gap-2.5">
                {/* DesignDNA logo mark */}
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="28" height="28" rx="7" fill="white" fillOpacity="0.12"/>
                  <rect x="1" y="1" width="26" height="26" rx="6" stroke="white" strokeOpacity="0.3" strokeWidth="0.8"/>
                  {/* DNA helix simplified as two interleaved strands */}
                  <path d="M9 6 C9 10 19 10 19 14 C19 18 9 18 9 22" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                  <path d="M19 6 C19 10 9 10 9 14 C9 18 19 18 19 22" stroke="white" strokeOpacity="0.5" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                  {/* Cross-link dots */}
                  <circle cx="14" cy="9.5" r="1.2" fill="white"/>
                  <circle cx="14" cy="14" r="1.2" fill="white" fillOpacity="0.6"/>
                  <circle cx="14" cy="18.5" r="1.2" fill="white"/>
                </svg>
                <span className="text-white font-semibold text-lg tracking-tighter">DesignDNA</span>
              </div>
              {appState === 'done' && (
                <button
                  onClick={handleReset}
                  className="liquid-glass rounded-full px-4 py-1.5 text-xs text-white/70 hover:text-white transition-colors hover:scale-105 active:scale-95"
                  style={{ transition: 'transform 0.15s, color 0.15s' }}
                >
                  ← New extraction
                </button>
              )}
            </nav>

            {/* ── IDLE ── */}
            {appState === 'idle' && (
              <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10 animate-fade-up">
                  <h1 className="text-5xl lg:text-6xl font-medium text-white text-center leading-[1.08] tracking-[-0.05em] mb-4" style={{ textShadow: '0 2px 24px rgba(0,0,0,0.6)' }}>
                  Extract the<br />
                  <em className="not-italic" style={{ fontFamily: 'var(--font-source-serif)', fontStyle: 'italic', color: 'rgba(255,255,255,0.75)' }}>
                    design DNA
                  </em>
                  <br />of any website.
                </h1>
                <p className="text-white/50 text-sm text-center max-w-xs mb-10 leading-relaxed">
                  Paste a URL. Get back colors, typography, spacing, and motion — ready for AI recreation.
                </p>
                <div className="w-full max-w-md px-2 sm:px-0">
                  <UrlForm onSubmit={handleSubmit} isLoading={false} />
                </div>
                <div className="flex flex-wrap gap-2 mt-8 justify-center">
                  {['Color Tokens', 'Typography', 'Motion', 'Layout'].map(tag => (
                    <span key={tag} className="liquid-glass rounded-full px-3 py-1 text-xs text-white/60">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── LOADING ── */}
            {isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10 animate-fade-up">
                <p className="text-white/30 text-xs mb-8 tracking-wide uppercase">This takes 30–60 seconds</p>
                <LoadingState steps={steps} />
              </div>
            )}

            {/* ── ERROR ── */}
            {appState === 'error' && (
              <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10 animate-fade-up gap-6">
                <LoadingState steps={steps} />
                <div className="liquid-glass rounded-2xl px-5 py-4 max-w-sm w-full">
                  <p className="text-sm text-red-300">{errorMessage}</p>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors underline underline-offset-4"
                >
                  Try again
                </button>
              </div>
            )}

            {/* ── DONE ── */}
            {appState === 'done' && sessionId && (
              <div className="flex-1 flex flex-col px-6 pb-6 animate-fade-up overflow-hidden min-h-0">
                <div className="mb-4">
                  <p className="text-white/40 text-xs mb-3">Extraction complete.</p>
                  <DownloadButtons sessionId={sessionId} designMdContent={designMdContent} promptMdContent={promptMdContent} />
                </div>
                <div className="flex-1 min-h-0">
                  <ResultPreview sessionId={sessionId} designMdContent={designMdContent} />
                </div>
              </div>
            )}

            {/* Bottom quote + credit */}
            {appState === 'idle' && (
              <div className="px-8 pb-8 text-center">
                <p className="text-[10px] text-white/30 tracking-widest uppercase mb-2">Design Intelligence</p>
                <p className="text-white/40 text-sm mb-6">
                  <span style={{ fontFamily: 'var(--font-source-serif)', fontStyle: 'italic' }}>
                    &ldquo;Every great site has a system.
                  </span>
                  {' '}Now you can see it.&rdquo;
                </p>
                <p className="text-[10px] text-white/20">
                  Made by{' '}
                  <a
                    href="https://gloriacodes.online"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/40 hover:text-white/70 transition-colors underline underline-offset-2"
                  >
                    Gloria Robinson
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL — desktop only ──────────────── */}
        <div className="hidden lg:flex lg:w-[48%] flex-col p-6 gap-4">

          {/* Top row */}
          <div className="flex justify-end">
            <div className="liquid-glass rounded-full px-4 py-2 flex items-center gap-3">
              <span className="text-xs text-white/50">AI-powered extraction</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
            </div>
          </div>

          {/* Feature cards */}
          <div className="flex-1 flex flex-col justify-center gap-4 mt-8">

            <p className="text-[10px] text-white/30 tracking-widest uppercase mb-2">What you&apos;ll get</p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Palette size={15} />, label: 'Color Palette', desc: 'Every hex, token, and usage mapped' },
                { icon: <Type size={15} />,    label: 'Typography',    desc: 'Font stack, scale ratio, weights' },
                { icon: <Ruler size={15} />,   label: 'Spacing Scale', desc: 'Base unit and full spacing system' },
                { icon: <Zap size={15} />,     label: 'Motion',        desc: 'Transitions, easing, animations' },
              ].map(f => (
                <div key={f.label} className="liquid-glass rounded-3xl p-5">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white mb-3">
                    {f.icon}
                  </div>
                  <p className="text-white text-sm font-medium mb-1">{f.label}</p>
                  <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Bottom info card */}
            <div className="liquid-glass rounded-3xl p-5 mt-2">
              <div className="flex items-start gap-4">
                <div className="w-16 h-12 rounded-xl bg-white/5 liquid-glass shrink-0 flex items-center justify-center">
                  <span className="text-2xl">✦</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium mb-1">Prompt-ready output</p>
                  <p className="text-white/40 text-xs leading-relaxed">
                    Get a <em style={{ fontFamily: 'var(--font-source-serif)', fontStyle: 'italic' }}>design.md</em> and
                    a <em style={{ fontFamily: 'var(--font-source-serif)', fontStyle: 'italic' }}>prompt.md</em> ready
                    to drop into Claude Code, Cursor, or v0.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
