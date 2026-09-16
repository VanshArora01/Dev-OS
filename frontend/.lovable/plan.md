

# CLIMX -- Climate Intelligence Dashboard

## Overview
Build a premium, futuristic, dark-themed climate intelligence dashboard with glassmorphism UI, Clerk auth, Mapbox maps, animated stats, and a cinematic design language. The existing codebase already has the dark theme, custom CSS utilities (glass panels, glow effects, wave background), Sidebar component, and key dependencies installed (Clerk, Mapbox GL, Framer Motion).

---

## Phase 1: Core Infrastructure

### 1.1 Clerk Authentication in main.tsx
- Wrap `<App />` inside `<ClerkProvider>` using `VITE_CLERK_PUBLISHABLE_KEY` environment variable
- The publishable key provided (`pk_test_...`) will be stored directly in code since it is a **publishable** (public) key -- this is safe and standard practice for Clerk

### 1.2 App Layout with Auth Gates
- Create `src/layouts/DashboardLayout.tsx` -- contains Sidebar + TopNav + wave background + main content area
- Wrap dashboard routes in `<SignedIn>` and show a landing/sign-in page via `<SignedOut>`
- Use `<UserButton />` in the top nav bar

### 1.3 Routing Setup (App.tsx)
- Add routes: `/`, `/projects`, `/simulation`, `/reports`, `/roi`, `/automation`, `/api`, `/settings`
- All routes render inside `DashboardLayout`

---

## Phase 2: Dashboard UI

### 2.1 Top Navigation Bar (`src/components/TopNav.tsx`)
- Glass-panel blurred background
- Search input with icon
- Notification bell icon with badge
- Clerk `<UserButton />`

### 2.2 Dashboard Page (`src/pages/Dashboard.tsx`)
- Welcome header: "Welcome back, {user name}" using Clerk's `useUser()` hook
- "+ New Project" CTA button with glow effect

### 2.3 Stats Cards (`src/components/StatsCards.tsx`)
- Four glassmorphism cards with staggered fade-in animations via Framer Motion:
  - Projects Monitored (24)
  - Risk Alerts (7)
  - Expected Annual Loss (formatted in INR)
  - Active Simulations (3)
- Animated number counters (counting up from 0)
- Neon glow on hover using existing `.glow-border-hover` utility

### 2.4 Projects Section (`src/components/ProjectsGrid.tsx`)
- Grid of project cards with mock data
- Each card: heatmap thumbnail placeholder, risk badge (color-coded High/Medium/Low), cost, location, last run date, View and Rerun buttons
- Hover: elevation lift + glow animation

---

## Phase 3: Map Simulation Page

### 3.1 Map Component (`src/components/MapView.tsx`)
- Full-screen Mapbox GL JS v3 map using `VITE_MAPBOX_ACCESS_TOKEN` (publishable key, safe in code)
- Mapbox Standard style, 3D terrain enabled
- Dark-styled controls
- Smooth `flyTo()` transitions
- Placeholder GeoJSON overlay and flood heatmap layer
- Before/After simulation toggle

### 3.2 Simulation Page (`src/pages/Simulation.tsx`)
- Left panel (glass sidebar overlay):
  - Scenario year slider (2030 / 2050 / 2100)
  - Hazard type selector (Flood / Heat / Storm)
  - Budget input field
  - "Run Simulation" button with loading animation
- Right panel (glass overlay):
  - Risk Score display
  - Expected Annual Loss
  - Top 5 AI Recommendations (placeholder text)
  - ROI percentage
- Cinematic animation on "Run Simulation" (loading state with glow pulse)

---

## Phase 4: Supporting Pages (Placeholder)

- `src/pages/Projects.tsx` -- project list view
- `src/pages/Reports.tsx` -- reports placeholder
- `src/pages/ROICalculator.tsx` -- ROI calculator UI
- `src/pages/Automation.tsx` -- automation placeholder
- `src/pages/APIAccess.tsx` -- API access placeholder
- `src/pages/Settings.tsx` -- settings placeholder

Each page will have a header, description, and "Coming Soon" styled content.

---

## Phase 5: Data Layer

### 5.1 TypeScript Types (`src/lib/types.ts`)
- `Project` interface matching the MongoDB schema
- `Simulation`, `Report`, `User` interfaces

### 5.2 Mock Data (`src/lib/mockData.ts`)
- Sample projects with Indian cities, risk scores, costs in INR
- Sample simulation results

### 5.3 MongoDB Placeholder (`src/lib/api.ts`)
- Exported async functions (getProjects, createProject, runSimulation) that return mock data
- Comments indicating where MongoDB Atlas API calls would go

---

## Phase 6: Polish and Animations

### 6.1 Loading Screen (`src/components/LoadingScreen.tsx`)
- CLIMX animated logo with glow pulse on app initial load

### 6.2 Animated Number Counter Hook (`src/hooks/useAnimatedCounter.ts`)
- Custom hook that counts from 0 to target value over a duration

### 6.3 Page Transitions
- Framer Motion `AnimatePresence` wrapping route outlet for fade/slide transitions

### 6.4 Wave Background
- Use existing CSS `.wave-bg` class in the layout (skipping `unicornstudio-react` as it's not available as an npm package and the CSS wave animation achieves the same effect)

### 6.5 Smooth Scrolling
- Skip `lenis` package (adds complexity with no benefit in a dashboard SPA with no long-scroll pages) -- the existing smooth scroll CSS is sufficient

---

## Technical Notes

- **Clerk key**: The provided `pk_test_...` key is a publishable key and will be stored directly in code per Clerk's official guidance
- **Mapbox token**: The provided token is a publishable access token and will be stored directly in code
- **MongoDB**: Frontend-only mock layer; no actual MongoDB connection (would require a backend/edge function)
- **unicornstudio-react / lenis**: Replaced with CSS animations and native smooth scrolling to avoid unavailable/unnecessary dependencies
- **No new npm packages needed** -- everything builds on existing dependencies (Clerk, Mapbox GL, Framer Motion, shadcn/ui, Recharts)

---

## File Creation Summary

| File | Purpose |
|------|---------|
| `src/layouts/DashboardLayout.tsx` | Main layout with sidebar + topnav |
| `src/components/TopNav.tsx` | Top navigation bar |
| `src/components/StatsCards.tsx` | Four animated stat cards |
| `src/components/ProjectsGrid.tsx` | Project cards grid |
| `src/components/MapView.tsx` | Mapbox map component |
| `src/components/LoadingScreen.tsx` | Animated loading screen |
| `src/pages/Dashboard.tsx` | Dashboard page |
| `src/pages/Simulation.tsx` | Map simulation page |
| `src/pages/Projects.tsx` | Projects list page |
| `src/pages/Reports.tsx` | Reports placeholder |
| `src/pages/ROICalculator.tsx` | ROI calculator |
| `src/pages/Automation.tsx` | Automation placeholder |
| `src/pages/APIAccess.tsx` | API access placeholder |
| `src/pages/Settings.tsx` | Settings placeholder |
| `src/lib/types.ts` | TypeScript interfaces |
| `src/lib/mockData.ts` | Mock project/simulation data |
| `src/lib/api.ts` | API placeholder functions |
| `src/hooks/useAnimatedCounter.ts` | Number animation hook |
| Modified: `src/main.tsx` | Add ClerkProvider |
| Modified: `src/App.tsx` | Add all routes + layout |

