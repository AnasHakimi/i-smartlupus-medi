import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "./modal";

describe("Modal", () => {
  it("renders trigger and opens content on click", () => {
    render(
      <Modal trigger={<button>Open</button>} title="Sahkan">
        <p>Body text</p>
      </Modal>
    );
    fireEvent.click(screen.getByText("Open"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Sahkan")).toBeInTheDocument();
    expect(screen.getByText("Body text")).toBeInTheDocument();
  });

  it("closes when the close button is clicked", () => {
    render(
      <Modal trigger={<button>Open</button>} title="T">
        <p>Body</p>
      </Modal>
    );
    fireEvent.click(screen.getByText("Open"));
    fireEvent.click(screen.getByRole("button", { name: /tutup/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <Modal trigger={<button>Open</button>} title="T" description="Pilih tindakan">
        <p>Body</p>
      </Modal>
    );
    fireEvent.click(screen.getByText("Open"));
    expect(screen.getByText("Pilih tindakan")).toBeInTheDocument();
  });
});
