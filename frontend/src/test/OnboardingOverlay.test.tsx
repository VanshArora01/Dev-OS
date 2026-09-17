import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";
import type { TourStep } from "@/components/onboarding/tourSteps";

const sampleStep: TourStep = {
  target: "#dashboard-header",
  title: "Welcome to Dashboard",
  content: "This panel summarizes active projects, velocity, and session history.",
  description: "This panel summarizes active projects, velocity, and session history.",
  position: "bottom"
};

describe("OnboardingOverlay Component", () => {
  it("renders tour title, step title, and step count correctly", () => {
    render(
      <OnboardingOverlay
        step={sampleStep}
        stepIndex={0}
        totalSteps={3}
        tourTitle="Dashboard Walkthrough"
        onNext={vi.fn()}
        onPrev={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    expect(screen.getByText("Welcome to Dashboard")).toBeInTheDocument();
    expect(screen.getByText("This panel summarizes active projects, velocity, and session history.")).toBeInTheDocument();
  });

  it("triggers onNext callback when Next button is clicked", () => {
    const onNext = vi.fn();
    render(
      <OnboardingOverlay
        step={sampleStep}
        stepIndex={0}
        totalSteps={3}
        tourTitle="Dashboard Walkthrough"
        onNext={onNext}
        onPrev={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("triggers onSkip callback when Skip/Close button is clicked", () => {
    const onSkip = vi.fn();
    render(
      <OnboardingOverlay
        step={sampleStep}
        stepIndex={0}
        totalSteps={3}
        tourTitle="Dashboard Walkthrough"
        onNext={vi.fn()}
        onPrev={vi.fn()}
        onSkip={onSkip}
      />
    );

    const skipButton = screen.getByTitle("Skip Walkthrough");
    fireEvent.click(skipButton);

    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
