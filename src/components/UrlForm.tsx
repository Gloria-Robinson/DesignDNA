'use client';

import { useState, type FormEvent } from 'react';
import { LiquidButton } from '@/components/ui/liquid-glass-button';

interface UrlFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function UrlForm({ onSubmit, isLoading }: UrlFormProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    let url = value.trim();
    if (!url) { setError('Please enter a URL.'); return; }
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    try { new URL(url); } catch { setError('Please enter a valid URL.'); return; }
    onSubmit(url);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
      <input
        type="text"
        value={value}
        onChange={e => { setValue(e.target.value); setError(''); }}
        placeholder="https://stripe.com"
        disabled={isLoading}
        autoFocus
        spellCheck={false}
        className="
          w-full h-14 px-6 rounded-2xl
          bg-white/8 text-white text-base placeholder:text-white/30
          outline-none focus:bg-white/12
          transition-all duration-200
          disabled:opacity-40 disabled:cursor-not-allowed
          liquid-glass
        "
        style={{ fontSize: '16px' /* prevents iOS zoom */ }}
      />
      <LiquidButton
        type="submit"
        disabled={isLoading}
        className="w-full h-14 rounded-2xl text-base font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2.5">
            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin inline-block" />
            Extracting…
          </span>
        ) : 'Extract Design DNA'}
      </LiquidButton>
      {error && <p className="text-xs text-red-300/80 pl-2">{error}</p>}
    </form>
  );
}
