import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProjectsGrid from "@/components/ProjectsGrid";

describe("ProjectsGrid Component", () => {
  it("renders fetched projects list correctly with name and description", async () => {
    render(
      <TooltipProvider>
        <BrowserRouter>
          <ProjectsGrid />
        </BrowserRouter>
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("DevOS Engine Core")).toBeInTheDocument();
    });
    expect(screen.getByText("PayFlow Stripe Gateway")).toBeInTheDocument();
    expect(screen.getByText("Neural Knowledge RAG Pipeline")).toBeInTheDocument();
  });

  it("filters projects when typeFilter is applied", async () => {
    render(
      <TooltipProvider>
        <BrowserRouter>
          <ProjectsGrid typeFilter="freelance" />
        </BrowserRouter>
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("PayFlow Stripe Gateway")).toBeInTheDocument();
    });

    expect(screen.queryByText("DevOS Engine Core")).not.toBeInTheDocument();
  });
});
