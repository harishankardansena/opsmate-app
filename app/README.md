# App Directory

This directory is the core of the Next.js App Router for OpsMate. It handles routing, page layouts, and API endpoints.

## Routing

- In the App Router, folders define routes. A folder named `dashboard` will be accessible at `/dashboard`.
- Use `page.tsx` for the UI of a route.
- Use `layout.tsx` for shared UI across multiple routes.
- Use `loading.tsx` to define a loading state.
- Use `error.tsx` to handle errors gracefully.

## API Routes

- API endpoints are defined inside the `api` folder using `route.ts` files (e.g., `app/api/users/route.ts` creates the `/api/users` endpoint).
- Export HTTP methods like `GET`, `POST`, `PUT`, `DELETE` from these files.

## Guidelines

- Keep pages focused on data fetching and layout structure.
- Move heavy logic and UI presentation to reusable components in the `/components` folder.
- Use Server Actions when appropriate for handling form submissions and data mutations directly from the client.
