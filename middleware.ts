// middleware.ts
export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tasks/:path*',
    '/leads/:path*',
    '/followups/:path*',
    '/notes/:path*',
    '/documents/:path*',
    '/performance/:path*',
    '/incentives/:path*',
    '/ai-chat/:path*',
    '/career/:path*',
    '/email-assistant/:path*',
    '/knowledge-base/:path*',
    '/admin/:path*',
  ],
};
