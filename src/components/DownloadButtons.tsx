'use client';

import { useState } from 'react';

interface DownloadButtonsProps {
  sessionId: string;
  designMdContent: string;
  promptMdContent: string;
}

export function DownloadButtons({ sessionId, designMdContent, promptMdContent }: DownloadButtonsProps) {
  const [copiedDesign, setCopiedDesign]     = useState(false);
  const [copiedPrompt, setCopiedPrompt]     = useState(false);
  const [downloadingFrames, setDownloadingFrames] = useState(false);

  const designUrl = `/api/download?sessionId=${encodeURIComponent(sessionId)}&file=design`;
  const promptUrl = `/api/download?sessionId=${encodeURIComponent(sessionId)}&file=prompt`;

  async function downloadFrames() {
    setDownloadingFrames(true);
    try {
      for (let i = 0; i < 5; i++) {
        const url = `/api/download?sessionId=${encodeURIComponent(sessionId)}&file=frame-${i}`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `section-${i + 1}-of-5.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        // Small delay so the browser registers each download separately
        await new Promise<void>(r => setTimeout(r, 400));
      }
    } finally {
      setDownloadingFrames(false);
    }
  }

  async function copyText(text: string, setDone: (v: boolean) => void) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch { /* silent */ }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Download row */}
      <div className="flex flex-wrap gap-2">
        <a href={designUrl} download="design.md"
          className="liquid-glass-strong rounded-full h-9 px-5 text-xs font-medium text-white flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform duration-150"
        >
          <DownloadIcon /> design.md
        </a>
        <a href={promptUrl} download="prompt.md"
          className="liquid-glass rounded-full h-9 px-5 text-xs font-medium text-white/70 flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform duration-150"
        >
          <DownloadIcon /> prompt.md
        </a>
        <button
          onClick={downloadFrames}
          disabled={downloadingFrames}
          className="liquid-glass rounded-full h-9 px-5 text-xs font-medium text-white/70 flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform duration-150 disabled:opacity-50 disabled:cursor-wait"
        >
          <ImageIcon />
          {downloadingFrames ? 'Saving…' : '5 page sections'}
        </button>
      </div>

      {/* Copy row */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => copyText(designMdContent, setCopiedDesign)}
          className="liquid-glass rounded-full h-9 px-5 text-xs text-white/60 flex items-center gap-2 hover:text-white/90 hover:scale-105 active:scale-95 transition-all duration-150"
        >
          {copiedDesign
            ? <><CheckIcon /> Copied design.md!</>
            : <><CopyIcon /> Copy design.md</>}
        </button>
        <button
          onClick={() => copyText(promptMdContent, setCopiedPrompt)}
          className="liquid-glass rounded-full h-9 px-5 text-xs text-white/60 flex items-center gap-2 hover:text-white/90 hover:scale-105 active:scale-95 transition-all duration-150"
        >
          {copiedPrompt
            ? <><CheckIcon /> Copied prompt.md!</>
            : <><CopyIcon /> Copy prompt.md</>}
        </button>
      </div>

      <p className="text-[10px] text-white/25 leading-relaxed px-1">
        Drop the two files into v0 or Claude Code. Attach the 5 section images for best layout accuracy.
      </p>
    </div>
  );
}

function DownloadIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v7M3.5 5.5 6 8l2.5-2.5M1.5 10h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function ImageIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="2" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="4" cy="5" r="1" fill="currentColor"/><path d="M1 8.5l2.5-2.5 2 2 2-2.5L11 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function CopyIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4 4V2.5A1.5 1.5 0 015.5 1h5A1.5 1.5 0 0112 2.5v5A1.5 1.5 0 0110.5 9H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
}
function CheckIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3.5 5-5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
