import React, { useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, ClerkLoaded, ClerkLoading, useAuth } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";
import { setAuthTokenGetter } from "./lib/api";
import AuthPage from "./pages/AuthPage";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";

function AuthInterceptor({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  
  React.useEffect(() => {
    // Safely wrap getToken to preserve its context
    setAuthTokenGetter(async () => {
      try {
        return await getToken();
      } catch (err) {
        console.error('[AuthInterceptor] Failed to get token:', err);
        return null;
      }
    });
  }, [getToken]);

  return <>{children}</>;
}
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
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
                    </Route>
                  </Routes>
                </OnboardingProvider>
              </AuthInterceptor>
            </SignedIn>
          </ClerkLoaded>
        </HashRouter>
      </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
