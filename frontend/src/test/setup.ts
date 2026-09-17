import "@testing-library/jest-dom";
import { vi } from "vitest";

// Force Demo Mode for unit tests to ensure fast offline execution
localStorage.setItem("devos_demo_mode", "true");

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

window.HTMLElement.prototype.scrollIntoView = function () {};

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock("@clerk/clerk-react", () => ({
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: "demo-user",
      fullName: "Demo Recruiter",
      primaryEmailAddress: { emailAddress: "recruiter@demo.devos" },
      imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  }),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: "demo-user",
    getToken: async () => "demo-token",
  }),
  ClerkLoaded: ({ children }: any) => children,
  ClerkLoading: () => null,
  SignedIn: ({ children }: any) => children,
  SignedOut: () => null,
  UserButton: () => null,
  SignInButton: ({ children }: any) => children,
  SignUpButton: ({ children }: any) => children,
}));
