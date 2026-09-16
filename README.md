<div align="center">

# DevOS — The Neural Engine for Developer Continuity

**Never lose context again.** DevOS brings your projects, PRDs, development activity, code repositories, connected cloud tools, and AI context into a unified operating environment for engineers.

[![Electron](https://img.shields.io/badge/Electron-29.4-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)

<br/>

### ⬇️ Download DevOS Desktop App for Windows

| Option | Download Link | Description | Size |
| :--- | :--- | :--- | :--- |
| **Windows Installer** | [**Download DevOS Setup 1.0.0.exe**](https://github.com/VanshArora01/Dev-OS/raw/main/downloads/DevOS%20Setup%201.0.0.exe) | Standard Windows installer with Start Menu & Desktop shortcuts | ~78.0 MB |
| **Portable (Zero-Install)** | [**Download DevOS 1.0.0.exe**](https://github.com/VanshArora01/Dev-OS/raw/main/downloads/DevOS%201.0.0.exe) | Single-file portable application — double click and run instantly | ~77.7 MB |

</div>

---

> [!NOTE]
> **Google Drive & GitHub Integrations Note:**
> Live OAuth login for Google Drive and GitHub integrations is currently awaiting formal app verification by Google and GitHub, so authentication with new external accounts is currently restricted.
> 
> 🎬 **See DevOS in Action:** Want to check out the app in action with live Google Drive file sync, GitHub repository context, Gmail updates, and Neural AI RAG?
> - 📺 [**Watch Demo Video on GitHub**](https://github.com/VanshArora01/Dev-OS/blob/main/DevOS%20Demo.mp4)
> - ⬇️ [**Download Demo Video (.mp4)**](https://github.com/VanshArora01/Dev-OS/raw/main/DevOS%20Demo.mp4)

---

## 🎬 See DevOS in Action

Want to explore DevOS and see all its features live without needing to configure local API keys or OAuth credentials?

- 📺 **Watch Online**: [**Watch DevOS Demo Video on GitHub**](https://github.com/VanshArora01/Dev-OS/blob/main/DevOS%20Demo.mp4) (plays directly on GitHub's video player)
- ⬇️ **Download File**: [**Download DevOS Demo MP4**](https://github.com/VanshArora01/Dev-OS/raw/main/DevOS%20Demo.mp4) (direct raw download)
- ⚡ **Try the App**: Download the standalone desktop installer from the table above to experience the UI, PRD ingestion engine, Neural AI Agent, local workspace managers, and desktop session tracker.

---

## Key Features

- **Project Command Center**: Isolated workspaces for each project maintaining task boards, technical briefs, session logs, decisions, and technology stack context.
- **Automated PRD Ingestion**: Upload or paste a Product Requirement Document (PRD), and DevOS auto-generates structured project briefs, architecture details, milestone tasks, and tech stack parameters.
- **Neural AI Agent**: Project-aware AI assistant powered by Groq and Google Gemini. Capable of inspecting live codebase RAG, retrieving cloud files, generating reports (PDF/DOCX), and executing project tasks.
- **GitHub Workspace Integration** *(See Video Demo)*: Connect your repositories to explore commit logs, pull requests, file trees, and code context directly inside DevOS.
- **Google Drive & Gmail Sync** *(See Video Demo)*: Search and summarize cloud documents, export project reports, and send automated email summaries via Google OAuth.
- **Electron Desktop Application**: Standalone desktop app featuring a floating widget session tracker, background screenshot logger, tray menu integration, and local OAuth callback server.
- **Guided Onboarding System**: Built-in interactive SVG spotlight product tours for Dashboard, Project Workspaces, GitHub, Google Drive, Gmail, and Neural AI.

---

## Architecture Overview

```
                        ┌─────────────────────────────────────────────────┐
                        │             DevOS Desktop / Web App             │
                        │   (React + TypeScript + Vite + TailwindCSS)    │
                        └───────────────────────┬─────────────────────────┘
                                                │
                                  REST API / WebSockets / IPC
                                                │
                        ┌───────────────────────▼─────────────────────────┐
                        │              DevOS Backend Service              │
                        │              (Node.js + Express)                │
                        └───────┬───────────────┬─────────────────┬───────┘
                                │               │                 │
             ┌──────────────────▼─┐   ┌─────────▼─────────┐   ┌───▼──────────────┐
             │   MongoDB Atlas    │   │ Qdrant Vector DB  │   │   AI Providers   │
             │ (Users, Projects,  │   │  (PRD & Codebase  │   │  (Groq LLaMA /   │
             │   Sessions, OAuth) │   │     RAG Index)    │   │  Gemini Vision)  │
             └────────────────────┘   └───────────────────┘   └──────────────────┘
```

---

## Directory Structure

```
Dev-OS-1/
├── frontend/               # React SPA UI, TailwindCSS styling, Framer Motion, Product Tour
│   ├── src/
│   │   ├── components/     # UI Components, Project Dock, Onboarding Overlay
│   │   ├── context/        # Onboarding & Workspace state management
│   │   ├── pages/          # Dashboard, ProjectDetails, Settings, LandingPage, Assistant
│   │   └── lib/            # API client & Electron Auth helpers
│   └── package.json
├── backend/                # Express API Server, AI Agent Routing, Tool Executors
│   ├── config/             # Groq, Gemini & MongoDB configuration
│   ├── models/             # Mongoose Schemas (User, Project, OAuthState, UserIntegration)
│   ├── routes/             # REST Endpoints (Projects, Integrations, AI, RAG)
│   ├── services/           # Neural Agent, Tool Executors, RAG, Email, Vision
│   └── package.json
└── electron/               # Desktop Wrapper & Installer Packaging
    ├── main.js             # Electron main process, Embedded Production Server, IPC
    ├── preload.js          # Secure Renderer Bridge
    ├── widget.html         # Floating session tracker widget
    └── package.json        # electron-builder packaging config
```

---

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **MongoDB Atlas**: Connection URI
- **Groq API Key**: For fast AI completions
- **Google Gemini API Key**: For blueprint & vision capabilities
- **Clerk API Keys**: For user authentication

---

### Environment Setup

#### 1. Backend Environment Configuration
Create `backend/.env` based on `backend/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/devos?retryWrites=true&w=majority

GROQ_API_KEY=your_groq_api_key
GROQ_VISION_MODEL=qwen/qwen3.8-27b
GEMINI_API_KEY=your_gemini_api_key

CLERK_SECRET_KEY=sk_test_...
INTEGRATION_ENCRYPTION_KEY=devos-drive-integration-secret-key-change-in-production

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/integrations/google/callback
```

#### 2. Frontend Environment Configuration
Create `frontend/.env` based on `frontend/.env.example`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE_URL=http://localhost:5000/api
```

---

### Local Development

#### Start the Backend API Server
```bash
cd backend
npm install
npm run dev
```

#### Start the Frontend Web Application
```bash
cd frontend
npm install
npm run dev
```

#### Launch the Desktop Application (Electron Development)
```bash
cd electron
npm install
npm start
```

---

## Packaging the Desktop Application

To package DevOS into a standalone Windows installer (`.exe`) and Portable executable:

```bash
cd electron
npm run dist
```

This compiles the frontend, injects assets into the Electron bundle, and generates the following distribution files in `electron/dist/`:
- **Installer**: `electron/dist/DevOS Setup 1.0.0.exe` (NSIS Installer)
- **Portable**: `electron/dist/DevOS 1.0.0.exe` (Standalone Portable Executable)
- **Unpacked**: `electron/dist/win-unpacked/` (Direct Application Binary)

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
