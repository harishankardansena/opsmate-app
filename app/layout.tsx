// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'OpsMate — AI-Powered Work Operating System',
  description: 'Manage tasks, leads, follow-ups, documents, meetings, performance, and career growth from a single AI-powered dashboard.',
  keywords: 'work management, AI assistant, task management, lead tracking, CRM, productivity',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
