import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { Source_Serif_4 } from 'next/font/google';
import { Geist_Mono } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DesignDNA — Extract the Design System of Any Website',
  description:
    'Paste a URL. Get back a complete design system — colors, typography, spacing, motion — ready for AI-powered recreation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${sourceSerif4.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-svh">{children}</body>
    </html>
  );
}
