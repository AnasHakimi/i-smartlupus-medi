import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Home, Plus } from "lucide-react";
import { BottomNav } from "./bottom-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("BottomNav", () => {
  const items = [
    { href: "/dashboard", label: "Utama", Icon: Home },
    { href: "/mohon", label: "Mohon", Icon: Plus },
  ];

  it("renders each item as a link with accessible label", () => {
    render(<BottomNav items={items} />);
    expect(screen.getByRole("link", { name: "Utama" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mohon" })).toBeInTheDocument();
  });

  it("marks active route with aria-current=page", () => {
    render(<BottomNav items={items} />);
    expect(screen.getByRole("link", { name: "Utama" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Mohon" })).not.toHaveAttribute("aria-current");
  });

  it("has safe-area padding class for iOS home bar", () => {
    const { container } = render(<BottomNav items={items} />);
    const nav = container.querySelector("nav");
    expect(nav?.className).toMatch(/safe-area|pb-\[env/);
  });
});
