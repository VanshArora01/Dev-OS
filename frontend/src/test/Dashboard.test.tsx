import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";

vi.mock("@/context/OnboardingContext", () => ({
  useOnboarding: () => ({
    triggerFirstProjectTour: vi.fn(),
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe("Dashboard Page", () => {
  it("fetches dashboard summary and renders metrics and projects", async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <Dashboard />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("DevOS Engine Core")).toBeInTheDocument();
    });

    expect(screen.getByText("PayFlow Stripe Gateway")).toBeInTheDocument();
  });

  it("opens New Project creation modal when New Project button is clicked", async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <Dashboard />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("DevOS Engine Core")).toBeInTheDocument();
    });

    const newProjectBtn = screen.getByRole("button", { name: /new project/i });
    fireEvent.click(newProjectBtn);

    expect(screen.getByText(/Initialize Node/i)).toBeInTheDocument();
  });
});
