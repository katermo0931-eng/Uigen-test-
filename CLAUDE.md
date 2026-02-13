# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup          # Install deps + generate Prisma client + run migrations
npm run dev            # Dev server with Turbopack (requires node-compat.cjs shim)
npm run build          # Production build
npm run lint           # ESLint
npm test               # Run all tests (vitest)
npx vitest run src/lib/__tests__/file-system.test.ts   # Run a single test file
npx prisma migrate dev # Apply schema changes
npx prisma generate    # Regenerate Prisma client after schema changes
npm run db:reset       # Reset database (destructive)
```

The `ANTHROPIC_API_KEY` env var is optional. Without it, the app uses a mock provider that returns static demo components.

## Architecture

UIGen is an AI-powered React component generator. Users describe components in a chat, Claude generates code into a virtual file system, and a sandboxed iframe renders a live preview.

### Core Data Flow

```
Chat UI → /api/chat (streaming) → Claude Haiku 4.5 with tools → Virtual FileSystem → Babel transform → Blob URL import map → Sandboxed iframe preview
```

### Key Layers

**AI Integration** (`src/app/api/chat/route.ts`, `src/lib/prompts/`, `src/lib/tools/`)
- Uses Vercel AI SDK `streamText()` with Anthropic provider and prompt caching
- Two AI tools: `str_replace_editor` (view/create/edit files) and `file_manager` (rename/delete)
- On stream finish, saves messages + file system snapshot to DB for authenticated users

**Virtual File System** (`src/lib/file-system.ts`)
- In-memory tree structure (Map-based), no disk writes
- Serializes to/from JSON for DB persistence (`Project.data` column)
- Exposed via `FileSystemContext` on the client

**Preview System** (`src/components/preview/PreviewFrame.tsx`, `src/lib/transform/jsx-transformer.ts`)
- Babel standalone transforms JSX/TSX to ES modules
- Local files mapped to blob URLs via import maps; third-party packages resolve to esm.sh CDN
- Entry point: `/App.jsx` (or `/App.tsx`, `/index.jsx`, etc.)
- Sandboxed iframe with Tailwind CSS and React 19 from CDN

**Auth** (`src/lib/auth.ts`, `src/actions/index.ts`, `src/middleware.ts`)
- Custom JWT auth using `jose`, bcrypt for passwords, HTTP-only cookie sessions (7-day expiry)
- Middleware protects `/api/projects` and `/api/filesystem` routes
- Anonymous users can use the app; work is tracked in sessionStorage (`anon-work-tracker.ts`)

### State Management

- `FileSystemContext` — virtual file system state, selected file
- `ChatContext` — chat messages, streaming status, wraps Vercel AI SDK's `useChat`
- Server actions in `src/actions/` for DB mutations (create/get projects, auth)

### Database

Prisma with SQLite. Two models: `User` (email/password) and `Project` (name, messages as JSON, data as serialized file system JSON). Projects can be anonymous (nullable `userId`).

### UI Components

shadcn/ui (New York style) with Radix primitives. Path alias: `@/components/ui/`. Monaco editor for code editing. `react-resizable-panels` for the layout.

## Testing

Vitest with jsdom environment and React Testing Library. Tests are co-located in `__tests__/` directories next to their source files.
