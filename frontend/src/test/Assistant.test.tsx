import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import Assistant from "@/pages/Assistant";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe("Assistant Page", () => {
  it("renders Workspace Neural assistant header and description", async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <Assistant />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText("Workspace Neural")).toBeInTheDocument();
    expect(screen.getByText(/Portfolio-level questions across every project/i)).toBeInTheDocument();
  });

  it("renders workspace prompt suggestions correctly", async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <Assistant />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/What's my most important project right now\?/i)).toBeInTheDocument();
    });
  });
});
