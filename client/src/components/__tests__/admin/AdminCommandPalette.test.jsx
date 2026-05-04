import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "../../../utils/test-utils";
import AdminCommandPalette from "../../admin/AdminCommandPalette";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";

vi.mock("../../../services", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    adminService: {
      globalSearch: vi.fn(),
    },
  };
});

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("AdminCommandPalette Component", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly when open", () => {
    render(<AdminCommandPalette open={true} onClose={onClose} />);
    expect(
      screen.getByPlaceholderText(/Search users, pages/),
    ).toBeInTheDocument();
    expect(screen.getByText("Dashboard Overview")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<AdminCommandPalette open={false} onClose={onClose} />);
    expect(
      screen.queryByPlaceholderText(/Search users, pages/),
    ).not.toBeInTheDocument();
  });

  it("filters static navigation commands", async () => {
    render(<AdminCommandPalette open={true} onClose={onClose} />);
    const input = screen.getByPlaceholderText(/Search users, pages/);

    fireEvent.change(input, { target: { value: "Users" } });

    await waitFor(() => {
      expect(screen.getByText("Users")).toBeInTheDocument();
      expect(screen.queryByText("Dashboard Overview")).not.toBeInTheDocument();
    });
  });

  it("calls adminService.globalSearch on valid input", async () => {
    adminService.globalSearch.mockResolvedValueOnce({
      data: {
        users: [{ _id: "u1", name: "User 1", email: "user@test.com" }],
        businesses: [],
        jobs: [],
        products: [],
      },
    });

    render(<AdminCommandPalette open={true} onClose={onClose} />);
    const input = screen.getByPlaceholderText(/Search users, pages/);

    fireEvent.change(input, { target: { value: "User" } });

    await waitFor(() => {
      expect(adminService.globalSearch).toHaveBeenCalledWith("User");
      expect(screen.getByText("User 1")).toBeInTheDocument();
    });
  });

  it("navigates to selected item using keyboard (ArrowDown and Enter)", async () => {
    render(<AdminCommandPalette open={true} onClose={onClose} />);

    // Default selected is 0 (Dashboard Overview)
    // Press ArrowDown to move to 1 (Users)
    fireEvent.keyDown(document, { key: "ArrowDown" });
    fireEvent.keyDown(document, { key: "Enter" });

    expect(mockNavigate).toHaveBeenCalledWith("/admin/users");
    expect(onClose).toHaveBeenCalled();
  });

  it("navigates to selected item using keyboard (ArrowUp wrap-around)", async () => {
    render(<AdminCommandPalette open={true} onClose={onClose} />);

    // Start at 0, ArrowUp should stay at 0 (or move to end depending on implementation - code says Math.max(i-1, 0))
    fireEvent.keyDown(document, { key: "ArrowUp" });
    fireEvent.keyDown(document, { key: "Enter" });

    expect(mockNavigate).toHaveBeenCalledWith("/admin/dashboard");
  });

  it("closes when Escape key is pressed", () => {
    render(<AdminCommandPalette open={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("closes when backdrop is clicked", () => {
    const { container } = render(
      <AdminCommandPalette open={true} onClose={onClose} />,
    );
    const backdrop = container.querySelector(".bg-slate-950\\/80");
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it("does not close when clicking the palette content", () => {
    render(<AdminCommandPalette open={true} onClose={onClose} />);
    const content = screen.getByPlaceholderText(/Search users, pages/);
    fireEvent.click(content);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("clears query when X button is clicked", async () => {
    render(<AdminCommandPalette open={true} onClose={onClose} />);
    const input = screen.getByPlaceholderText(/Search users, pages/);
    fireEvent.change(input, { target: { value: "test" } });

    const clearBtn = screen.getByRole("button", { name: "" }); // The X button doesn't have a label but it's a button
    fireEvent.click(clearBtn);

    expect(input.value).toBe("");
  });

  it("updates selection on mouse enter", async () => {
    render(<AdminCommandPalette open={true} onClose={onClose} />);
    const usersItem = screen.getByText("Users").closest("button");

    fireEvent.mouseEnter(usersItem);
    fireEvent.keyDown(document, { key: "Enter" });

    expect(mockNavigate).toHaveBeenCalledWith("/admin/users");
  });
});
