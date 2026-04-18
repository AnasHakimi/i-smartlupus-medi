import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ListItem } from "./list-item";

describe("ListItem", () => {
  it("renders title, subtitle, leading and trailing slots", () => {
    render(
      <ListItem
        leading={<span data-testid="lead">L</span>}
        title="PC Dell 7070"
        subtitle="Ali Bin Ahmad"
        trailing={<span data-testid="trail">T</span>}
      />
    );
    expect(screen.getByTestId("lead")).toBeInTheDocument();
    expect(screen.getByText("PC Dell 7070")).toBeInTheDocument();
    expect(screen.getByText("Ali Bin Ahmad")).toBeInTheDocument();
    expect(screen.getByTestId("trail")).toBeInTheDocument();
  });

  it("fires onClick when interactive", () => {
    const onClick = vi.fn();
    render(<ListItem title="Click me" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: /click me/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders a non-interactive row without button role when onClick omitted", () => {
    render(<ListItem title="Readonly" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Readonly")).toBeInTheDocument();
  });

  it("keeps min-height 56px per MASTER spec", () => {
    render(<ListItem title="X" />);
    const row = screen.getByText("X").closest('[data-list-item="true"]');
    expect(row).toHaveClass("min-h-[56px]");
  });
});
