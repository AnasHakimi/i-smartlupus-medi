import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "./Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("Sidebar", () => {
  it("renders nav items for the role", () => {
    render(
      <Sidebar
        role="admin"
        name="Anas Hakimi"
        collapsed={false}
        onToggleCollapsed={() => {}}
      />
    );
    expect(screen.getByText("Utama")).toBeInTheDocument();
    expect(screen.getByText("Pengguna")).toBeInTheDocument();
    expect(screen.getByText("Semua")).toBeInTheDocument();
    expect(screen.getByText("Profil")).toBeInTheDocument();
  });

  it("shows user footer when expanded", () => {
    render(
      <Sidebar
        role="admin"
        name="Anas Hakimi"
        collapsed={false}
        onToggleCollapsed={() => {}}
      />
    );
    expect(screen.getByText("Anas Hakimi")).toBeInTheDocument();
  });

  it("hides labels and footer when collapsed", () => {
    render(
      <Sidebar
        role="admin"
        name="Anas Hakimi"
        collapsed={true}
        onToggleCollapsed={() => {}}
      />
    );
    expect(screen.queryByText("Utama")).not.toBeInTheDocument();
    expect(screen.queryByText("Anas Hakimi")).not.toBeInTheDocument();
  });

  it("fires onToggleCollapsed when chevron clicked", () => {
    const onToggleCollapsed = vi.fn();
    render(
      <Sidebar
        role="admin"
        name="Anas Hakimi"
        collapsed={false}
        onToggleCollapsed={onToggleCollapsed}
      />
    );
    fireEvent.click(screen.getByLabelText("Runtuhkan bar sisi"));
    expect(onToggleCollapsed).toHaveBeenCalledOnce();
  });

  it("marks the active route with aria-current", () => {
    render(
      <Sidebar
        role="admin"
        name="Anas Hakimi"
        collapsed={false}
        onToggleCollapsed={() => {}}
      />
    );
    const utamaLink = screen.getByText("Utama").closest("a");
    expect(utamaLink).toHaveAttribute("aria-current", "page");
  });
});
