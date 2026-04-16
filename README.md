# CodexFlow

Make Codex work on real codebases. CodexFlow turns coding tasks into an execution pipeline with full visibility and verification.

## Overview

CodexFlow is a clean, technical interface for AI coding task execution that makes the entire process visible, understandable, and demoable. It selects the right repo context, runs Codex on coding tasks, verifies output with lint and tests, and tracks results in a beautiful task board.

## Design Philosophy

- **Show execution clearly** - Every step is visible
- **Show proof, not hype** - Results are verified with real tests
- **Keep layouts structured** - Clean and readable at all times
- **Emphasize statuses, diffs, and logs** - Focus on what matters
- **No clutter** - Minimal but powerful UI

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Lucide Icons** - Icon library

## Features

### Landing Page
- Clear value proposition
- Visual explanation of how it works
- Sample task execution preview
- Call-to-action buttons
- Live board and task-detail routes wired to the task API

### Task Board
- 5-column Kanban view: Queued, Running, Passed, Failed, Needs Review
- Task cards with essential info
- Status badges with color coding
- Score display for completed tasks
- Empty state messages

### Task Detail View
- Full task information and prompt
- Selected files panel with relevance scores
- Code diff viewer
- Verification status (lint, tests)
- Execution logs
- Task metadata

### Create Task Modal
- Intuitive form with fields for:
  - Task title
  - Task prompt
  - Repository path
  - Safe lint command preview
  - Safe test command preview

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Use CodexFlow with Multica + Codex

If you want to run this project through **Multica** with a **Codex** agent on your own machine, use the project guide in [`docs/multica-codex-setup.md`](docs/multica-codex-setup.md).

That guide covers:
- installing Multica and Codex
- connecting your machine as a runtime
- creating a Codex agent for this repo
- assigning CodexFlow issues in Multica
- repo-specific verification commands and prompts

### Project Structure

```
├── app/                         # Next.js App Router pages + API routes
│   ├── api/tasks/               # Task list/detail/run/retry/timeline endpoints
│   ├── board/page.tsx           # Live task board route
│   ├── tasks/[id]/page.tsx      # Live task detail route
│   ├── onboarding/page.tsx      # Operator onboarding route
│   └── page.tsx                 # Landing page
├── components/                  # Shared UI and task-detail panels
├── engine/                      # Python execution engine (scan/rank/prompt/verify)
├── features/dashboard/          # Board + task detail client views
├── lib/server/                  # SQLite task persistence + execution queue
├── data/                        # SQLite database files
├── codexflow.config.json        # Safe repo + verification command config
├── package.json
└── tests/                       # Python engine tests
```

## Color Scheme

- **Primary**: Violet 600 (#7c3aed)
- **Background**: White
- **Surface**: Gray 50 (#f9fafb)
- **Border**: Gray 200 (#e5e7eb)
- **Text**: Gray 900 (#111827)
- **Muted**: Gray 600 (#4b5563)
- **Success**: Green 600 (#16a34a)
- **Warning**: Amber 500 (#f59e0b)
- **Danger**: Red 600 (#dc2626)

## Status Badge Variants

- **Queued**: Gray
- **Running**: Blue
- **Passed**: Green
- **Failed**: Red
- **Needs Review**: Amber

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

### Adding New Features

1. Create or extend components in `/components` or `features/dashboard`
2. Use the Button, Badge, Dialog, and Input UI components
3. Keep new task flows wired to the real `/api/tasks` endpoints
4. Keep verification commands server-controlled via `codexflow.config.json`

## Seed Data

The app seeds a small set of SQLite-backed sample tasks for the demo board. New tasks are created through the live API and run through the Python execution engine with patch previews, verification output, and timeline events.

## Future Enhancements

- Animated transitions with Framer Motion
- Live running indicators
- Collapsible logs
- Syntax-highlighted code diffs
- Keyboard shortcuts
- Real backend integration
- Dark mode support
- Full project management features

## Design Notes

The UI is intentionally minimal and focused on proof over hype. Every element serves a purpose:
- Cards are large and scannable
- Status is immediately visible
- Verification results are clear and unambiguous
- Logs and diffs are properly formatted
- No gradients or unnecessary visual flourishes

This design ensures judges and stakeholders immediately recognize this as a serious execution system, not just a prompt wrapper.

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT
