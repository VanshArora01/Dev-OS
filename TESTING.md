# DevOS Automated Testing Architecture

This repository contains comprehensive automated test suites for both the Node/Express backend and the React/TypeScript frontend. All tests run completely offline using local mocks for external services (Groq, Gemini, MongoDB, Qdrant, and Clerk).

---

## 1. Running Tests Locally

### Backend Unit & Integration Tests
Run the backend test suite from the `backend/` directory:

```bash
cd backend
npm test
```

- **Framework**: Jest + Supertest
- **Scope**: Core REST route handlers (`/api/projects`, `/api/dashboard`, `/api/ai`), backend services (`neuralAgent`, `agentIntentRouter`, `groqToolRecovery`), and Mongoose model schema validations (`Project`, `Conversation`, `UserIntegration`).
- **Mocking**: External APIs (Groq, Gemini, Qdrant vector DB) and MongoDB queries are mocked for instant, deterministic offline execution.

### Frontend Component & Integration Tests
Run the frontend test suite from the `frontend/` directory:

```bash
cd frontend
npm test
```

- **Framework**: Vitest + React Testing Library + jsdom
- **Scope**: Key UI components and pages (`ProjectsGrid`, `OnboardingOverlay`, `Dashboard`, `Assistant`).
- **Coverage**: Asserts state updates, project filtering, modal interactions, prompt dispatches, and navigation callbacks.

---

## 2. Test Suite Architecture

```
Dev-OS/
├── backend/
│   └── tests/
│       ├── routes.test.js           # REST endpoint request/response tests
│       ├── services.test.js         # Core business logic & tool recovery tests
│       ├── models.test.js           # Mongoose schema validation tests
│       └── agentIntentRouter.test.js# LLM capability matrix & tool aliasing tests
└── frontend/
    └── src/
        └── test/
            ├── setup.ts             # Global jsdom mocks & forced demo mode flag
            ├── ProjectDock.test.tsx # Project listing & search filtering tests
            ├── OnboardingOverlay.test.tsx # Tour overlay step navigation tests
            ├── Dashboard.test.tsx   # Overview metrics & modal creation tests
            └── Assistant.test.tsx   # Workspace Neural AI assistant tests
```

---

## 3. Mocking Strategy & Security

- **No Live API Keys Required**: External calls to LLM providers (Groq, Gemini) and Vector DB (Qdrant) are intercepted by local mock fixtures.
- **Frontend Guest Demo Mode**: In unit tests and standalone frontend builds without backend connections, `mockData.ts` intercepts network calls transparently, providing realistic sample project data.
