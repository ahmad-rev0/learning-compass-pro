# ATLAS — The Autonomous Agentic Learning Platform

<p align="center">
  <img src="https://img.shields.io/badge/status-active%20development-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/AI-Gemini%20%2B%20Exa-blue" alt="AI Models">
  <img src="https://img.shields.io/badge/architecture-agentic%20state%20machine-purple" alt="Architecture">
</p>

> **ATLAS transforms passive learning management into an active, gamified, self‑correcting tutoring system.**

ATLAS is a fully autonomous agent—**not a chatbot**—that runs a continuous **Observe → Evaluate → Decide → Act** loop. It silently monitors student performance, detects struggle in real time, and proactively generates personalized recovery quests with curated resources from the open web.

---

## Team & Contribution Note

ATLAS was built as a two‑person hackathon project by **Muhammad Ahmad Nadeem** and **Maryam Khan**. Due to the fast‑paced nature of the event and tight deadlines, all commits were pushed from Ahmad's GitHub account for efficiency. Maryam contributed equally to the architecture, ideation, and feature development throughout the build process and has been formally added as a repository contributor.

We believe in transparent credit—this project reflects the full collaborative effort of both team members.

---

## The Problem

| Pain Point | Consequence |
| :--- | :--- |
| **Silent struggling** | Teachers discover gaps only at exam time. |
| **One‑size‑fits‑all content** | Students disengage from irrelevant material. |
| **Reactive intervention** | Help arrives *after* failure, not *before*. |
| **No contextual resources** | Students waste time Googling instead of learning. |

---

## The Agentic Core (How It Works)

ATLAS operates on a closed‑loop state machine powered by **Gemini** (planning & grading) and **Exa AI** (neural web search).

| Phase | Action |
| :--- | :--- |
| **Observe** | Tracks submission scores, momentum trends, inactivity, and streak decay. |
| **Evaluate** | Classifies student into 1 of 5 urgency states: `normal` → `micro_stuck` → `momentum_dip` → `double_trouble` → `emergency_recovery`. |
| **Decide** | Gemini crafts a multi‑step quest with motivational text and calibrated XP rewards. |
| **Act** | Exa AI performs **3–5 neural searches per quest** to attach precise, real‑world resources (Stack Overflow answers, interactive tutorials, real‑code examples) to each checklist step. |

### Dual‑Trigger Architecture

The agent fires **without the student ever asking**:
- **Proactive:** Immediately on loading the Quests page.
- **Reactive:** After every graded submission (coursework, self‑study, or external upload).

---

## Key Features

### Student Experience

- **AI‑Generated Quests** – Multi‑step recovery missions with per‑step curated links.
- **3D Quest Trail** – Three.js visualization turns progress into an explorable space world.
- **Agent Brain Dashboard** – Full transparency into *why* the AI intervened (teaches metacognition).
- **Upload & Grade** – Submit any external document for instant AI feedback—no course enrollment required.
- **Achievements & Gamification** – XP, levels, streaks, and personalized challenges.

### Teacher & Institution Tools

- **Automated AI Grading** – Structured feedback on MCQs, Free Text, and Code submissions.
- **Early‑Warning System** – Visual dashboards showing exactly who is in `momentum_dip` or `emergency_recovery`.
- **Row Level Security (RLS)** – Enterprise‑grade data isolation per user role.
- **Analytics** – Aggregate performance data across courses and cohorts.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18 + TypeScript, Tailwind CSS, Framer Motion, Three.js |
| **Backend & DB** | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| **AI / ML** | Gemini (LLM for Planning & Grading), Exa AI (Neural Web Search) |
| **Design System** | Retro Pixel Art UI (CRT effects, 8‑bit SFX) |

### Core Database Tables

`profiles` → `courses` → `submissions` → `quests` → `agent_logs`  
*(13 tables total with full RLS policies)*

---

## Why ATLAS?

| Traditional AI Tutoring | **ATLAS Agentic Approach** |
| :--- | :--- |
| Waits for the student to ask | **Detects struggle autonomously via momentum scoring** |
| Links to generic documentation | **Uses Exa AI to surface exact Stack Overflow answers** |
| One‑size‑fits‑all advice | **Calibrated urgency (`micro_stuck` vs `emergency`)** |
| Disconnected from grading | **Closed loop: Grade → Analyze → Intervene → Verify** |

---

## License

All Rights Reserved. 

---

<p align="center">
  <b>From Passive LMS to Active Learning Partner.</b><br/>
  <i>Watch over every student, in real time.</i>
</p>
