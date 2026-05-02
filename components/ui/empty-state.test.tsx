import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Inbox } from "lucide-react";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders icon, title and description", () => {
    render(
      <EmptyState
        icon={<Inbox />}
        title="Tiada permohonan"
        description="Mohon pelupusan pertama anda untuk mula."
      />
    );
    expect(screen.getByText("Tiada permohonan")).toBeInTheDocument();
    expect(screen.getByText("Mohon pelupusan pertama anda untuk mula.")).toBeInTheDocument();
  });

  it("renders action button and fires onAction", () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        icon={<Inbox />}
        title="T"
        action={{ label: "+ Mohon Baru", onClick: onAction }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /mohon baru/i }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("has region role for screen readers", () => {
    render(<EmptyState icon={<Inbox />} title="T" />);
    expect(screen.getByRole("region")).toBeInTheDocument();
  });
});
