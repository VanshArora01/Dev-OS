# Contributing to DevOS

Thank you for your interest in contributing to DevOS! This guide outlines the setup process, coding standards, and contribution workflow.

---

## 1. Local Development Setup

### Prerequisites
- **Node.js**: v18.x or v20.x
- **npm**: v9.x or higher

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/VanshArora01/Dev-OS.git
   cd Dev-OS
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

3. **Backend Setup**:
   ```bash
   cd ../backend
   npm install
   cp .env.example .env
   npm run dev
   ```

---

## 2. Running Automated Tests

Before submitting a pull request, ensure all test suites pass locally:

- **Frontend Tests**: `cd frontend && npm test`
- **Backend Tests**: `cd backend && npm test`
- **Production Build**: `cd frontend && npm run build`

---

## 3. Pull Request Guidelines

1. **Branch Naming**: Use descriptive branch names like `feat/vector-caching` or `fix/auth-interceptor`.
2. **Commit Messages**: Write clear, concise commit messages following conventional commit guidelines (e.g., `feat:`, `fix:`, `docs:`, `test:`).
3. **Secret Hygiene**: Never commit actual API keys, database credentials, or secret tokens. Always update `.env.example` with generic placeholders if adding new environment variables.
