import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ASTRA-Guard | Clinical Health Monitoring & Early Warning System',
  description: 'AI-Powered Astronaut Health Monitoring for NASA Space Apps Challenge 2026',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
