import type { Metadata, Viewport } from 'next';
import './globals.css';

/** Viewport configuration for BreatheWise AI */
export const viewport: Viewport = {
  themeColor: '#0ea5e9',
};

/** Root metadata for BreatheWise AI */
export const metadata: Metadata = {
  title: 'BreatheWise AI — Urban Air Quality Assistant',
  description:
    'AI-powered urban air quality survival & sustainability planner. Personalized low-emission routines, indoor hacks, and smog alerts for your family.',
  keywords: ['air quality', 'AQI', 'smog', 'urban health', 'sustainability', 'AI'],
};

/**
 * RootLayout — the top-level server component that wraps every page.
 * Applies the global CSS reset + Tailwind base styles.
 * Uses system-ui font stack to avoid external network calls.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-sky-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
