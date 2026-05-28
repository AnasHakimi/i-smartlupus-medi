import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Inbox } from "lucide-react";
import { KpiCard } from "./KpiCard";

describe("KpiCard", () => {
  it("renders label and value", () => {
    render(<KpiCard label="Antrian Saya" value="12" tone="emerald" />);
    expect(screen.getByText("Antrian Saya")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders an icon when provided", () => {
    render(<KpiCard label="Test" value="5" tone="emerald" icon={Inbox} />);
    // lucide renders an svg
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("renders a positive delta with up arrow", () => {
    render(
      <KpiCard
        label="Disemak"
        value="34"
        tone="amber"
        pctChange={25}
        goodDirection="up"
      />,
    );
    expect(screen.getByText(/25%/)).toBeInTheDocument();
    expect(screen.getByText("▲")).toBeInTheDocument();
  });

  it("renders a negative delta with down arrow", () => {
    render(
      <KpiCard
        label="Median Masa"
        value="2.3 jam"
        tone="sky"
        pctChange={-15}
        goodDirection="down"
      />,
    );
    expect(screen.getByText(/15%/)).toBeInTheDocument();
    expect(screen.getByText("▼")).toBeInTheDocument();
  });

  it("omits the delta indicator when pctChange is null", () => {
    render(<KpiCard label="Queue" value="5" tone="emerald" pctChange={null} />);
    expect(screen.queryByText("▲")).not.toBeInTheDocument();
    expect(screen.queryByText("▼")).not.toBeInTheDocument();
  });

  it("renders delta window caption when provided", () => {
    render(
      <KpiCard
        label="X"
        value="10"
        tone="emerald"
        pctChange={5}
        goodDirection="up"
        deltaWindow="vs 7h"
      />,
    );
    expect(screen.getByText("vs 7h")).toBeInTheDocument();
  });
});
