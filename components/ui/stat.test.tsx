import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Stat } from "./stat";

describe("Stat", () => {
  it("renders label and value", () => {
    render(<Stat label="Menunggu Semakan" value={12} />);
    expect(screen.getByText("Menunggu Semakan")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders positive delta in up tone", () => {
    render(<Stat label="x" value={10} delta={{ value: 12.5, direction: "up" }} />);
    const delta = screen.getByText(/12.5%/);
    expect(delta).toBeInTheDocument();
    const wrapper = delta.closest("div");
    expect(wrapper?.className).toMatch(/emerald|chip-done-fg/);
  });

  it("renders negative delta in down tone", () => {
    render(<Stat label="x" value={10} delta={{ value: 4.2, direction: "down" }} />);
    const delta = screen.getByText(/4.2%/);
    const wrapper = delta.closest("div");
    expect(wrapper?.className).toMatch(/red|destructive|chip-rejected-fg/);
  });

  it("renders sparkline when data provided", () => {
    const { container } = render(
      <Stat label="x" value={10} trend={[1, 2, 3, 5, 4, 7, 9]} />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelector("polyline")).toBeInTheDocument();
  });

  it("applies tabular-nums to value for no jitter on refresh", () => {
    render(<Stat label="x" value={42} />);
    expect(screen.getByText("42").className).toMatch(/tabular-nums/);
  });
});
