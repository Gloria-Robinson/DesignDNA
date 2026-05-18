'use client';

interface ResultPreviewProps {
  sessionId: string;
  designMdContent: string;
}

export function ResultPreview({ sessionId, designMdContent }: ResultPreviewProps) {
  const screenshotUrl = `/api/download?sessionId=${encodeURIComponent(sessionId)}&file=screenshot`;

  return (
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-3 mt-4">

      {/* Screenshot */}
      <div className="liquid-glass rounded-2xl overflow-hidden flex flex-col">
        <div className="flex items-center gap-1.5 px-3 py-2.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-white/15" />
          <span className="w-2 h-2 rounded-full bg-white/10" />
          <span className="w-2 h-2 rounded-full bg-white/8" />
          <span className="ml-2 text-[10px] text-white/25" style={{ fontFamily: 'var(--font-mono)' }}>screenshot.png</span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={screenshotUrl}
          alt="Captured screenshot of the analyzed website"
          className="w-full h-auto max-h-72 object-cover object-top"
        />
      </div>

      {/* design.md — full content, scrollable */}
      <div className="liquid-glass rounded-2xl flex flex-col min-h-0 max-h-80 lg:max-h-none lg:h-full">
        <div className="flex items-center gap-1.5 px-3 py-2.5 shrink-0 border-b border-white/5">
          <span className="w-2 h-2 rounded-full bg-white/15" />
          <span className="w-2 h-2 rounded-full bg-white/10" />
          <span className="w-2 h-2 rounded-full bg-white/8" />
          <span className="ml-2 text-[10px] text-white/25" style={{ fontFamily: 'var(--font-mono)' }}>design.md</span>
        </div>
        <pre
          className="flex-1 overflow-y-auto px-4 py-3 text-[11px] leading-relaxed text-white/50 whitespace-pre-wrap"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {designMdContent || '— loading —'}
        </pre>
      </div>
    </div>
  );
}
