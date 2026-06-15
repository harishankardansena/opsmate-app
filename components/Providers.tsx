'use client';
// components/Providers.tsx
import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from './Toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}
