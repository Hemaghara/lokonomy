import { render, screen, fireEvent } from "../../../utils/test-utils";
import ConfirmModal from "../../admin/ConfirmModal";
import { describe, it, expect, vi } from "vitest";
import { useConfirmState } from "../../../context/ConfirmContext";

vi.mock("../../../context/ConfirmContext", () => ({
  useConfirmState: vi.fn(),
  ConfirmProvider: ({ children }) => (
    <div data-testid="confirm-provider">{children}</div>
  ),
}));

describe("ConfirmModal Component", () => {
  it("does not render if not open", () => {
    useConfirmState.mockReturnValue({
      modalState: { isOpen: false },
      closeConfirm: vi.fn(),
    });
    render(<ConfirmModal />);
    expect(screen.queryByText(/Cancel/i)).not.toBeInTheDocument();
  });

  it("renders modal with correct content when open", () => {
    useConfirmState.mockReturnValue({
      modalState: {
        isOpen: true,
        title: "Delete Item",
        description: "Are you sure you want to delete this?",
        confirmLabel: "Delete Now",
        isDanger: true,
        onConfirm: vi.fn(),
      },
      closeConfirm: vi.fn(),
    });

    render(<ConfirmModal />);

    expect(screen.getByText("Delete Item")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to delete this?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Delete Now")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", () => {
    const onConfirm = vi.fn();
    useConfirmState.mockReturnValue({
      modalState: {
        isOpen: true,
        title: "Confirm",
        description: "...",
        confirmLabel: "Go",
        isDanger: false,
        onConfirm,
      },
      closeConfirm: vi.fn(),
    });

    render(<ConfirmModal />);
    fireEvent.click(screen.getByText("Go"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls closeConfirm when cancel button is clicked", () => {
    const closeConfirm = vi.fn();
    useConfirmState.mockReturnValue({
      modalState: {
        isOpen: true,
        title: "Confirm",
        description: "...",
        confirmLabel: "Go",
        isDanger: false,
        onConfirm: vi.fn(),
      },
      closeConfirm,
    });

    render(<ConfirmModal />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(closeConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls closeConfirm when close (X) icon is clicked", () => {
    const closeConfirm = vi.fn();
    useConfirmState.mockReturnValue({
      modalState: {
        isOpen: true,
        title: "Confirm",
        description: "...",
        confirmLabel: "Go",
        isDanger: false,
        onConfirm: vi.fn(),
      },
      closeConfirm,
    });

    render(<ConfirmModal />);
    // The X icon is inside a button
    const closeButton = screen.getAllByRole("button")[0]; // First button is usually the X in this layout
    fireEvent.click(closeButton);
    expect(closeConfirm).toHaveBeenCalled();
  });

  it("calls closeConfirm when backdrop is clicked", () => {
    const closeConfirm = vi.fn();
    useConfirmState.mockReturnValue({
      modalState: {
        isOpen: true,
        title: "Confirm",
        description: "...",
        confirmLabel: "Go",
        isDanger: false,
        onConfirm: vi.fn(),
      },
      closeConfirm,
    });

    const { container } = render(<ConfirmModal />);
    // The backdrop is the first motion.div inside the outer div
    const backdrop = container.querySelector(".bg-slate-950\\/80");
    fireEvent.click(backdrop);
    expect(closeConfirm).toHaveBeenCalled();
  });

  it("applies danger styles when isDanger is true", () => {
    useConfirmState.mockReturnValue({
      modalState: {
        isOpen: true,
        title: "Danger",
        description: "...",
        confirmLabel: "Delete",
        isDanger: true,
        onConfirm: vi.fn(),
      },
      closeConfirm: vi.fn(),
    });

    render(<ConfirmModal />);
    const confirmBtn = screen.getByText("Delete");
    expect(confirmBtn).toHaveClass("bg-rose-600");

    const iconContainer = screen
      .getByText("Danger")
      .closest(".p-6")
      .querySelector(".w-10");
    expect(iconContainer).toHaveClass("bg-rose-500/10");
  });

  it("applies indigo styles when isDanger is false", () => {
    useConfirmState.mockReturnValue({
      modalState: {
        isOpen: true,
        title: "Neutral",
        description: "...",
        confirmLabel: "Confirm",
        isDanger: false,
        onConfirm: vi.fn(),
      },
      closeConfirm: vi.fn(),
    });

    render(<ConfirmModal />);
    const confirmBtn = screen.getByText("Confirm");
    expect(confirmBtn).toHaveClass("bg-indigo-600");

    const iconContainer = screen
      .getByText("Neutral")
      .closest(".p-6")
      .querySelector(".w-10");
    expect(iconContainer).toHaveClass("bg-indigo-500/10");
  });
});
