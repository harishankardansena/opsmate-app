# OpsMate

OpsMate is a modern web application built with Next.js, designed to streamline operations and management tasks.

## Features

- **Authentication:** Secure user login and registration powered by [NextAuth.js](https://next-auth.js.org/).
- **Database:** MongoDB integration using [Mongoose](https://mongoosejs.com/) for robust data modeling.
- **Media Management:** Image and media handling using [Cloudinary](https://cloudinary.com/).
- **Email Services:** Transactional emails powered by [Resend](https://resend.com/).
- **Rich Text Editing:** Integrated rich text editor using [Tiptap](https://tiptap.dev/).
- **Data Visualization:** Interactive charts and graphs built with [Recharts](https://recharts.org/).
- **Modern UI:** Styled with a modern aesthetic, utilizing icons from [Lucide React](https://lucide.dev/).

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Database:** MongoDB
- **Styling:** CSS Modules / Global CSS
- **Authentication:** NextAuth.js

## Getting Started

### Prerequisites

- Node.js 18.x or later
- MongoDB instance (local or Atlas)
- Cloudinary account
- Resend API key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd opsmate-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the necessary environment variables based on the `.env.example` file (if available) or checking the codebase for required keys (e.g., `MONGODB_URI`, `NEXTAUTH_SECRET`, Cloudinary credentials, Resend API key).

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/`: Next.js App Router pages and API routes.
- `components/`: Reusable React components.
- `lib/`: Utility functions and shared logic.
- `models/`: Mongoose database schemas and models.
- `public/`: Static assets.

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the app for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code issues.

## License

This project is proprietary and confidential.
