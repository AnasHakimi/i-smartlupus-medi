import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Chip } from "./chip";

describe("Chip", () => {
  it("renders children with tone-pending styling", () => {
    render(<Chip tone="pending">Menunggu</Chip>);
    const chip = screen.getByText("Menunggu");
    expect(chip).toBeInTheDocument();
    expect(chip.className).toMatch(/rounded-sm|rounded-\[6px\]/);
  });

  it("renders all tones without error", () => {
    const tones = ["pending", "reviewing", "executing", "done", "rejected", "neutral"] as const;
    for (const tone of tones) {
      const { unmount } = render(<Chip tone={tone}>{tone}</Chip>);
      expect(screen.getByText(tone)).toBeInTheDocument();
      unmount();
    }
  });

  it("supports optional leading icon", () => {
    const Icon = () => <svg data-testid="icon" />;
    render(<Chip tone="done" icon={<Icon />}>Selesai</Chip>);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByText("Selesai")).toBeInTheDocument();
  });
});
