# Plan: Atlas — Full Implementation Study Guide (Markdown)

I'll produce a single comprehensive Markdown document saved to `/mnt/documents/atlas-implementation-guide.md` (delivered as a downloadable artifact) that teaches you how to rebuild this entire project from scratch.

## What the document will contain

### 1. Project Overview
- Vision, problem solved, target users (students + teachers)
- Feature map (auth, courses, assignments, submissions, AI grading, agentic nudges, quests, study plans, self-study, achievements, gamification)

### 2. Tech Stack & Why
- **Frontend:** React 18 + Vite + TypeScript + Tailwind + shadcn/ui + React Router + TanStack Query + Framer Motion + Recharts + Three.js
- **Backend (primary):** Lovable Cloud / Supabase (Postgres, Auth, Storage, Edge Functions in Deno)
- **Backend (simulation):** Optional Python FastAPI service on Render
- **AI:** Lovable AI Gateway (Gemini) for grading/planning + Exa AI for neural resource discovery

### 3. High-Level Architecture
- Mermaid diagram of: Client ↔ Supabase (DB/Auth/Storage) ↔ Edge Functions ↔ (Gemini + Exa)
- Triple-AI pattern (Evaluation / Planning / Discovery)
- Agentic loop: Observe → Evaluate → Decide → Act

### 4. Database Schema (complete)
- Every table (`profiles`, `user_roles`, `courses`, `course_enrollments`, `assignments`, `submissions`, `gamification_progress`, `quests`, `study_plans`, `self_study_assignments`, `agent_logs`, `badge_unlocks`, `generated_achievements`)
- Full `CREATE TABLE` SQL with columns, defaults, GRANTs, RLS policies
- All `SECURITY DEFINER` helper functions (`has_role`, `is_course_teacher`, `is_enrolled_in_course`, `is_assignment_teacher`)
- Triggers for new-user profile/role/gamification creation
- Storage bucket setup (`submissions`)

### 5. Authentication & Roles
- Email/password + Google OAuth setup
- `app_role` enum + `user_roles` table pattern (anti-recursion)
- `useAuth` hook implementation
- Protected route patterns

### 6. Edge Functions (each fully explained with code)
- `agent-nudge` — the agentic core: signal aggregation, intervention classification (emergency_recovery / re_engagement / skill_support / side_quest / momentum_boost / quest_focus), Gemini tool-calling for quest generation, Exa per-step resource enrichment
- `grade-submission` — AI rubric grading + feedback JSON
- `generate-study-plan` — weekly plan synthesis
- `generate-assignment` — AI assignment authoring
- `generate-achievements` — dynamic badge generation
- CORS, JWT validation, input validation (Zod), Lovable AI Gateway invocation pattern

### 7. Agentic Logic Deep-Dive
- State machine: `normal`, `micro_stuck`, `momentum_dip`, `double_trouble`, `emergency_recovery`
- Momentum scoring formula
- Thresholds and decision tree (pseudocode + real code)
- Quest schema: `steps[]` with `text`, `resource_url`, `resource_title`
- Start → Work → Complete workflow

### 8. Frontend Structure
- Routing map (`/auth`, `/dashboard`, student & teacher pages)
- Key components: `StateIndicator`, `QuestsPanel`, `AgentDecisionLog`, `MomentumChart`, `StatsBar`, `WizardGuide`, `QuestPath3D`
- Design system: HSL semantic tokens in `index.css`, `tailwind.config.ts`
- TanStack Query patterns for Supabase data
- Framer Motion animations + retro SFX

### 9. Python FastAPI Simulation Backend
- Full file tree
- `main.py` endpoints
- `MockStudent`, `Agent`, `QuestEngine`, `ExaClient`, state machine
- Async simulation loop
- Render deployment (`render.yaml`)

### 10. Integration Patterns
- Exa neural + keyword search (TS + Python clients)
- Lovable AI Gateway tool-calling for structured output
- Realtime/polling for live event log

### 11. Security Checklist
- RLS on every table
- GRANTs to `authenticated` / `service_role`
- No service-role key in client
- Role checks via SECURITY DEFINER

### 12. Step-by-Step Rebuild Roadmap
- Phase 1: Scaffold (Vite + Tailwind + shadcn)
- Phase 2: Auth + roles + profiles
- Phase 3: Courses/assignments CRUD
- Phase 4: Submissions + storage + AI grading
- Phase 5: Gamification (XP, momentum, streaks)
- Phase 6: Agentic nudge engine + Exa
- Phase 7: Study plans + self-study + achievements
- Phase 8: Dashboards (student + teacher) + analytics
- Phase 9: Polish (3D, animations, splash, demo mode)

### 13. Environment & Secrets
- `LOVABLE_API_KEY`, `EXA_API_KEY`, `SUPABASE_*`
- `.env` conventions, where each secret is used

### 14. Appendix
- Glossary
- Useful code snippets (CORS helper, Exa wrapper, momentum calculator, RLS helper functions)
- Mermaid diagrams (architecture, agent loop, DB ERD)

## Deliverable
A single file `atlas-implementation-guide.md` (~estimated 40–60 KB, several thousand lines with extensive code snippets) emitted via `<presentation-artifact>` so you can download and study it.

Approve and I'll generate it.
