import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renders label and fires onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Hantar</Button>);
    const btn = screen.getByRole("button", { name: "Hantar" });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("default md size is 44px (h-11, Apple HIG touch target)", () => {
    render(<Button>OK</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-11");
  });

  it("lg size uses 48px min-height for hero CTAs", () => {
    render(<Button size="lg">Hantar</Button>);
    expect(screen.getByRole("button")).toHaveClass("min-h-touch");
  });

  it("renders destructive variant with destructive background", () => {
    render(<Button variant="destructive">Padam</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toMatch(/destructive/);
  });

  it("shows spinner and disables when loading", () => {
    render(<Button loading>Hantar</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("does not fire onClick when disabled", () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>OK</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});
