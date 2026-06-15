# Components Directory

This directory contains reusable React components for the OpsMate application.

## Structure

Components should be organized logically. If a component becomes complex or requires its own sub-components, create a subdirectory for it.

- Use standard PascalCase for component file names (e.g., `Button.tsx`, `Header.tsx`).
- Keep components as focused and modular as possible.
- If a component has specific styles, use CSS modules or place the related CSS file alongside the component (e.g., `Button.module.css`).

## Best Practices

- **Reusability:** Design components to be reusable across different pages and layouts.
- **Props:** Use TypeScript interfaces to strongly type component props.
- **Client vs. Server Components:** By default, components in the Next.js App Router are Server Components. Add the `"use client"` directive at the top of the file if the component requires client-side interactivity (e.g., hooks like `useState`, `useEffect`, or event listeners).
