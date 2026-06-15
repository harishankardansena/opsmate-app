# Lib Directory

The `lib` directory is dedicated to utility functions, database connection setups, configuration wrappers, and shared business logic.

## Purpose

- **Database Connections:** Code to establish connections to MongoDB or other services.
- **Utility Functions:** Helper functions used across multiple components or API routes (e.g., date formatting, data transformation).
- **Service Wrappers:** Configuration and initialization for third-party services like Resend, Cloudinary, or NextAuth.

## Organization

- Keep files focused on a specific domain (e.g., `db.ts` for database connection, `utils.ts` for general helpers, `cloudinary.ts` for image uploads).
- Export modular functions instead of large classes when possible for better tree-shaking and testability.
