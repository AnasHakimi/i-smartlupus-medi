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

  it("default md size is 36px (h-9, dense inline)", () => {
    render(<Button>OK</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-9");
  });

  it("lg size uses 48px min-height for full-width sticky submits", () => {
    render(<Button size="lg">Hantar</Button>);
    expect(screen.getByRole("button")).toHaveClass("min-h-touch");
  });

  it("sm size is 32px (h-8) for ultra-dense rows", () => {
    render(<Button size="sm">Edit</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-8");
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
