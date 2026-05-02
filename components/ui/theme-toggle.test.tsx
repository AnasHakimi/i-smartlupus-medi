import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "./theme-toggle";

function withProvider(initialDark: boolean) {
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
    matches: initialDark,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("renders a single switch button", () => {
    withProvider(false);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("in light mode, aria-checked is false and label points to dark", () => {
    withProvider(false);
    const btn = screen.getByRole("switch");
    expect(btn).toHaveAttribute("aria-checked", "false");
    expect(btn).toHaveAttribute("aria-label", "Tukar kepada tema gelap");
  });

  it("in dark mode, aria-checked is true and label points to light", () => {
    withProvider(true);
    const btn = screen.getByRole("switch");
    expect(btn).toHaveAttribute("aria-checked", "true");
    expect(btn).toHaveAttribute("aria-label", "Tukar kepada tema terang");
  });

  it("clicking toggles theme and updates html class", () => {
    withProvider(false);
    const btn = screen.getByRole("switch");
    fireEvent.click(btn);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
    fireEvent.click(btn);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
  });
});
