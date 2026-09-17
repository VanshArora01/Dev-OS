import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, ClerkLoaded, ClerkLoading, useAuth } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";
import { setAuthTokenGetter, isDemoMode, setDemoMode } from "./lib/api";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import SettingsPage from "./pages/Settings";
import QuickLinks from "./pages/QuickLinks";
import ApiTester from "./pages/ApiTester";
import Reminders from "./pages/Reminders";
import Assistant from "./pages/Assistant";
import LandingPage from "./pages/LandingPage";
import { OnboardingProvider } from "./context/OnboardingContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const queryClient = new QueryClient();
const HAS_CLERK = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

function AuthInterceptor({ children }: { children: React.ReactNode }) {
  try {
    const { getToken } = useAuth();
    React.useEffect(() => {
      setAuthTokenGetter(async () => {
        try {
          return await getToken();
        } catch {
          return null;
        }
      });
    }, [getToken]);
  } catch {
    // Clerk not mounted or in demo mode
  }

  return <>{children}</>;
}

function MainRoutes() {
  const location = useLocation();
  const [demoState, setDemoState] = useState(isDemoMode());

  useEffect(() => {
    if (location.search.includes('demo=true') || location.hash.includes('demo')) {
      setDemoMode(true);
      setDemoState(true);
    }
  }, [location]);

  if (demoState || !HAS_CLERK) {
    return (
      <OnboardingProvider>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/project/:id" element={<ProjectDetails />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/quick-links" element={<QuickLinks />} />
            <Route path="/api-tester" element={<ApiTester />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </OnboardingProvider>
    );
  }

  return (
    <>
      <ClerkLoading>
        <div className="h-screen w-full bg-[#f4f5fb] dark:bg-[#0b0b12] flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
        </div>
      </ClerkLoading>
      <ClerkLoaded>
        <SignedOut>
          <Routes>
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </SignedOut>

        <SignedIn>
          <AuthInterceptor>
            <OnboardingProvider>
              <Routes>
                <Route element={<DashboardLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/project/:id" element={<ProjectDetails />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/quick-links" element={<QuickLinks />} />
                  <Route path="/api-tester" element={<ApiTester />} />
                  <Route path="/reminders" element={<Reminders />} />
                  <Route path="/assistant" element={<Assistant />} />
                  <Route path="*" element={<Dashboard />} />
                </Route>
              </Routes>
            </OnboardingProvider>
          </AuthInterceptor>
        </SignedIn>
      </ClerkLoaded>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <MainRoutes />
          </HashRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
