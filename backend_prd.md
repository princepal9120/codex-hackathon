# CodexFlow Technical Specification

## Overview
CodexFlow is a lightweight full-stack application that manages coding tasks executed by Codex using repo-aware context selection and post-execution verification.

## Architecture
The system has 3 layers:

1. Frontend
2. API Backend
3. Execution Engine

## High-Level Flow
1. User creates task from frontend
2. Backend stores task
3. Execution engine scans repository
4. Ranker selects relevant files
5. Prompt builder constructs model input
6. Codex client executes task
7. Runner triggers lint/tests
8. Backend stores result
9. Frontend displays output

## Recommended Stack

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui
- optional Framer Motion

### Backend
- FastAPI or Next.js API routes
- Python preferred if execution engine is Python
- SQLite for hackathon MVP
- SQLAlchemy or simple ORM

### Execution Engine
- Python
- subprocess for lint/tests
- pathlib/os.walk for scanning
- OpenAI API client for Codex/model calls
## Modules

### Frontend Modules
- Task board
- Task creation modal/form
- Task detail view
- Verification panel
- Diff preview component
- Repo context panel

### Backend Modules
- Task API
- Execution API
- Repo scanner service
- Ranker service
- Prompt builder service
- Codex execution service
- Verification service

## Data Model

### Task
- id
- title
- description
- status
- prompt
- repo_path
- created_at
- updated_at
- score
- selected_files_json
- codex_output
- diff_output
- lint_status
- test_status
- logs

### Status enum
- queued
- running
- passed
- failed
- needs_review
## API Endpoints

### POST /api/tasks
Create task

Request:
json
{
  "title": "Add rate limiting to login endpoint",
  "prompt": "Add rate limiting to login endpoint",
  "repoPath": "/path/to/repo"
}

Response:
json
{
  "id": "task_123",
  "status": "queued"
}
### GET /api/tasks
List tasks

### GET /api/tasks/:id
Get task details

### POST /api/tasks/:id/run
Execute task

### POST /api/tasks/:id/retry
Retry task

## Execution Engine Details

### 1. Repo Scanner
Responsibilities:
- recursively scan files
- ignore directories:
  - .git
  - node_modules
  - dist
  - build
  - .next
  - venv
  - __pycache__
- skip large or binary files

Output:
- file metadata
- file content excerpt
- path

### 2. Ranker
MVP heuristic:
- task keyword overlap with file path
- task keyword overlap with filename
- task keyword overlap with file content
- optional import/symbol boosts

Output:
- ranked list of files with score

### 3. Prompt Builder
Input:
- task
- top ranked files
- file snippets

Output:
- model-ready prompt

Prompt structure:
- system instruction
- user task
- selected context
- expected output format

### 4. Codex Client
Responsibilities:
- send prompt to OpenAI model
- collect response
- return patch or structured edit

### 5. Patch Handling
MVP options:
- Option A: show patch only
- Option B: apply patch automatically
- Option C: apply only in demo repo

Recommendation:
- use patch preview first
- only auto-apply in controlled demo

### 6. Verifier
Responsibilities:
- run lint command
- run test command
- capture stdout/stderr
- assign pass/fail

### 7. Score Engine
Example:
- patch generated = 20
- lint passed = 30
- tests passed = 40
- changed relevant files = 10

Total = 100

## Frontend State Model

### Board Columns
- Queued
- Running
- Passed
- Failed
- Needs Review
### Task Detail Sections
- task summary
- selected files
- generated diff
- lint/test output
- score
- retry button

## UI/UX Notes
- technical, minimal, clean SaaS look
- use badges for statuses
- use code blocks for diff/logs
- prioritize board + task detail split layout
## Security / Safety
- do not run arbitrary commands from user input
- restrict lint/test commands to configured safe commands
- sandbox execution where possible
- avoid auto-applying patches in unknown repos for MVP

## Repo Configuration
Use a local config file:

### `codexflow.config.json`
json
{
  "repoPath": ".",
  "lintCommand": "npm run lint",
  "testCommand": "npm test",
  "maxFiles": 8
}
## MVP Implementation Order
1. task model + mock data
2. board UI
3. repo scanner
4. ranker
5. prompt builder
6. Codex call
7. lint/test verification
8. task detail page
9. polish

## Demo Strategy
Use one known repo and one known task.
Preconfigure:
- repo path
- lint command
- test command

This reduces live demo risk.

## Future Enhancements
- semantic code search
- repo graph analysis
- GitHub PR mode
- CI/CD integration
- human approval workflow
- multi-model evaluation