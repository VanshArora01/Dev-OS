# Changelog — DevOS

All notable changes to the DevOS project will be documented in this file.

## [v1.1.0] - 2026-09-17
### Added
- **Guest Demo Mode**: Standalone frontend evaluation mode working without Clerk OAuth or live backend connection, populated with high-fidelity sample data.
- **Static Deployment Configs**: Added `vercel.json` and `netlify.toml` for 1-click SPA deployments on Vercel and Netlify.
- **Backend Test Suite**: Express route integration tests (Jest + Supertest), service unit tests, and Mongoose schema validations.
- **Frontend Test Suite**: Component test coverage using Vitest and React Testing Library for `ProjectsGrid`, `OnboardingOverlay`, `Dashboard`, and `Assistant`.
- **Project Documentation**: Added `TESTING.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, and technical README rewrite.

### Security & Sanitization
- Replaced hardcoded integration key placeholder in `README.md` with generic placeholder `your_encryption_key_here`.
- Audited `backend/.env.example` and `frontend/.env.example` to ensure all examples are sanitized.

---

## [v1.0.0] - 2026-09-12
### Added
- **Electron Packaging**: Packaged DevOS as a native Windows desktop app executable.
- **Live Cloud Backend**: Configured CORS and dynamic origin handling for deployed Express backend on Render.
- **Onboarding Tour**: Interactive step-by-step product walkthrough overlay.

---

## [v0.3.0] - 2026-09-05
### Added
- **Neural Agent Runtime**: Multi-agent LLM tool execution engine supporting Groq LLaMA 3 and Gemini 1.5 Pro.
- **Tool Recovery**: Fallback JSON parsing for malformed LLM tool call generations.
- **Human-In-The-Loop (HITL)**: Explicit user approval workflow for email dispatch and Google Drive file modifications.

---

## [v0.2.0] - 2026-08-28
### Added
- **PRD Ingestion Pipeline**: Support for parsing PDF, DOCX, and Markdown product requirement documents.
- **Qdrant Vector RAG**: Chunking and embedding storage for contextual developer session retrieval.

---

## [v0.1.0] - 2026-08-15
### Added
- **Initial Architecture**: Scaffolded React + TypeScript + Vite frontend and Node/Express backend.
- **Clerk Authentication**: Integrated Clerk JWT authentication and route protection.
