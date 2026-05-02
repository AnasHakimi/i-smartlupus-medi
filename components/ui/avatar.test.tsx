import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "./avatar";

describe("Avatar", () => {
  it("renders initials from name", () => {
    render(<Avatar name="Ali Bin Ahmad" />);
    expect(screen.getByText("AB")).toBeInTheDocument();
  });

  it("handles single-word names", () => {
    render(<Avatar name="Makcik" />);
    expect(screen.getByText("MA")).toBeInTheDocument();
  });

  it("applies role color when role provided", () => {
    const { container } = render(<Avatar name="x" role="pelulus" />);
    const avatar = container.firstChild as HTMLElement;
    expect(avatar.className).toMatch(/blue|emerald|amber|indigo|slate/);
  });

  it("respects size prop", () => {
    const { container } = render(<Avatar name="x" size="lg" />);
    expect((container.firstChild as HTMLElement).className).toMatch(/h-10|h-12|w-10|w-12/);
  });

  it("has accessible label via aria-label", () => {
    render(<Avatar name="Ali Bin Ahmad" />);
    expect(screen.getByLabelText("Ali Bin Ahmad")).toBeInTheDocument();
  });
});
