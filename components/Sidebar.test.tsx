import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Sidebar from "./Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("Sidebar", () => {
  it("renders nav items for the role", () => {
    render(<Sidebar role="admin" name="Anas Hakimi" collapsed={false} />);
    expect(screen.getByText("Utama")).toBeInTheDocument();
    expect(screen.getByText("Pengguna")).toBeInTheDocument();
    expect(screen.getByText("Semua")).toBeInTheDocument();
    expect(screen.getByText("Profil")).toBeInTheDocument();
  });

  it("shows user footer when expanded", () => {
    render(<Sidebar role="admin" name="Anas Hakimi" collapsed={false} />);
    expect(screen.getByText("Anas Hakimi")).toBeInTheDocument();
  });

  it("hides labels and footer when collapsed", () => {
    render(<Sidebar role="admin" name="Anas Hakimi" collapsed={true} />);
    expect(screen.queryByText("Utama")).not.toBeInTheDocument();
    expect(screen.queryByText("Anas Hakimi")).not.toBeInTheDocument();
  });

  it("does not render a collapse toggle button (AppHeader owns it)", () => {
    render(<Sidebar role="admin" name="Anas Hakimi" collapsed={false} />);
    expect(screen.queryByLabelText("Runtuhkan bar sisi")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Kembangkan bar sisi")).not.toBeInTheDocument();
  });

  it("marks the active route with aria-current", () => {
    render(<Sidebar role="admin" name="Anas Hakimi" collapsed={false} />);
    const utamaLink = screen.getByText("Utama").closest("a");
    expect(utamaLink).toHaveAttribute("aria-current", "page");
  });
});
