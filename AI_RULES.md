# AI Development Rules

This document outlines the rules and conventions for the AI developer working on this project. Adhering to these rules ensures consistency, maintainability, and quality.

## Tech Stack

This project is built with a modern, type-safe, and efficient technology stack:

- **Framework**: React (using Vite for bundling and development).
- **Language**: TypeScript for static typing and improved developer experience.
- **Styling**: Tailwind CSS for a utility-first styling approach.
- **UI Components**: shadcn/ui, providing accessible and reusable components built on Radix UI.
- **Routing**: React Router (`react-router-dom`) for client-side navigation.
- **Data Fetching & Caching**: TanStack Query (`@tanstack/react-query`) for managing server state.
- **Backend & Database**: Supabase for database, authentication, and serverless functions.
- **Forms**: React Hook Form (`react-hook-form`) for performance and validation, paired with Zod for schema definition.
- **Notifications**: Sonner for simple and elegant toast notifications.
- **Icons**: Lucide React for a comprehensive and consistent set of icons.

## Library Usage Rules

To maintain consistency, please follow these strict rules on library usage:

1.  **UI Components**:
    - **ALWAYS** use components from the `shadcn/ui` library (`@/components/ui/*`) for all standard UI elements (Buttons, Cards, Inputs, Dialogs, etc.).
    - **DO NOT** create custom components for functionality that already exists in `shadcn/ui`.
    - **ALWAYS** place new, custom, reusable components in the `src/components/` directory.

2.  **Styling**:
    - **ALWAYS** use Tailwind CSS utility classes for styling.
    - **AVOID** writing custom CSS in `.css` files. The existing `index.css` is primarily for base styles and Tailwind directives.
    - **DO NOT** use inline `style` attributes unless it's for a dynamic value that cannot be handled by Tailwind classes (e.g., a color from a color picker).

3.  **Routing**:
    - **ALWAYS** use `react-router-dom` for all routing and navigation.
    - All route definitions **MUST** be kept within `src/App.tsx`.

4.  **Data Fetching & State Management**:
    - **ALWAYS** use `TanStack Query` (`useQuery`, `useMutation`) for all interactions with the Supabase backend (fetching, creating, updating, deleting data).
    - For simple, local component state, use React's `useState` hook.
    - For global client-side state that needs to be shared, use `useContext`.

5.  **Forms**:
    - **ALWAYS** use `react-hook-form` for building and managing forms.
    - **ALWAYS** use `zod` to define form schemas for validation.
    - Connect `react-hook-form` and `zod` using the `@hookform/resolvers` package.

6.  **Notifications**:
    - **ALWAYS** use the `sonner` library for displaying toast notifications. Import `toast` from `sonner` and call functions like `toast.success()` or `toast.error()`.

7.  **Icons**:
    - **ALWAYS** use icons from the `lucide-react` package.
    - **DO NOT** install other icon libraries or use inline SVGs.

8.  **Backend Interaction**:
    - **ALWAYS** use the pre-configured Supabase client instance imported from `src/integrations/supabase/client.ts` for all database and authentication operations.