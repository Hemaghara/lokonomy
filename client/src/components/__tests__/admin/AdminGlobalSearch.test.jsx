import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "../../../utils/test-utils";
import AdminGlobalSearch from "../../admin/AdminGlobalSearch";
import { adminService } from "../../../services";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../services", () => ({
  adminService: {
    globalSearch: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("AdminGlobalSearch Component", () => {
  const mockResults = {
    data: {
      users: [{ _id: "u1", name: "John Doe", email: "john@example.com" }],
      businesses: [
        {
          _id: "b1",
          businessName: "Tech Shop",
          mainCategory: "Retail",
          district: "Downtown",
        },
      ],
      jobs: [
        {
          _id: "j1",
          position: "Developer",
          posterName: "Tech Corp",
          district: "Uptown",
        },
      ],
      products: [
        {
          _id: "p1",
          productName: "Laptop",
          price: 1000,
          mainCategory: "Electronics",
        },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search input", () => {
    render(<AdminGlobalSearch />);
    expect(
      screen.getByPlaceholderText(/Search users, businesses, jobs.../i),
    ).toBeInTheDocument();
  });

  it("does NOT trigger search for queries with less than 2 characters", async () => {
    render(<AdminGlobalSearch />);
    const input = screen.getByPlaceholderText(
      /Search users, businesses, jobs.../i,
    );

    fireEvent.change(input, { target: { value: "a" } });
    await new Promise((r) => setTimeout(r, 600));

    expect(adminService.globalSearch).not.toHaveBeenCalled();
  });

  it("triggers search after typing 2 or more characters (debounce)", async () => {
    adminService.globalSearch.mockResolvedValueOnce(mockResults);
    render(<AdminGlobalSearch />);

    const input = screen.getByPlaceholderText(
      /Search users, businesses, jobs.../i,
    );
    fireEvent.change(input, { target: { value: "test" } });

    await new Promise((r) => setTimeout(r, 600));

    await waitFor(() => {
      expect(adminService.globalSearch).toHaveBeenCalledWith("test");
    });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Tech Shop")).toBeInTheDocument();
      expect(screen.getByText("Developer")).toBeInTheDocument();
      expect(screen.getByText("Laptop")).toBeInTheDocument();
    });
  });

  it("shows loading state while searching", async () => {
    adminService.globalSearch.mockReturnValue(
      new Promise((resolve) => setTimeout(() => resolve(mockResults), 1000)),
    );
    render(<AdminGlobalSearch />);

    const input = screen.getByPlaceholderText(
      /Search users, businesses, jobs.../i,
    );
    fireEvent.change(input, { target: { value: "test" } });

    await new Promise((r) => setTimeout(r, 500));

    await waitFor(() => {
      expect(screen.getByText(/Searching.../i)).toBeInTheDocument();
    });
  });

  it("closes results when clicking outside", async () => {
    adminService.globalSearch.mockResolvedValueOnce(mockResults);
    render(<AdminGlobalSearch />);

    const input = screen.getByPlaceholderText(
      /Search users, businesses, jobs.../i,
    );
    fireEvent.change(input, { target: { value: "test" } });
    await new Promise((r) => setTimeout(r, 600));

    await waitFor(() =>
      expect(screen.getByText("John Doe")).toBeInTheDocument(),
    );

    fireEvent.mouseDown(document);

    await waitFor(() => {
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });
  });

  it("navigates correctly for different result types", async () => {
    adminService.globalSearch.mockResolvedValue(mockResults);
    render(<AdminGlobalSearch />);

    const input = screen.getByPlaceholderText(
      /Search users, businesses, jobs.../i,
    );

    // Test User navigation
    fireEvent.change(input, { target: { value: "test" } });
    await new Promise((r) => setTimeout(r, 600));
    await waitFor(() => screen.getByText("John Doe"));
    fireEvent.click(screen.getByText("John Doe"));
    expect(mockNavigate).toHaveBeenCalledWith(
      "/admin/users?search=john@example.com",
    );

    // Test Business navigation
    fireEvent.change(input, { target: { value: "test" } });
    await new Promise((r) => setTimeout(r, 600));
    await waitFor(() => screen.getByText("Tech Shop"));
    fireEvent.click(screen.getByText("Tech Shop"));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/businesses?id=b1");

    // Test Job navigation
    fireEvent.change(input, { target: { value: "test" } });
    await new Promise((r) => setTimeout(r, 600));
    await waitFor(() => screen.getByText("Developer"));
    fireEvent.click(screen.getByText("Developer"));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/jobs?id=j1");

    // Test Product navigation
    fireEvent.change(input, { target: { value: "test" } });
    await new Promise((r) => setTimeout(r, 600));
    await waitFor(() => screen.getByText("Laptop"));
    fireEvent.click(screen.getByText("Laptop"));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/marketplace?id=p1");
  });

  it("clears query and closes results when clear button is clicked", async () => {
    adminService.globalSearch.mockResolvedValueOnce(mockResults);
    render(<AdminGlobalSearch />);

    const input = screen.getByPlaceholderText(
      /Search users, businesses, jobs.../i,
    );
    fireEvent.change(input, { target: { value: "test" } });

    await new Promise((r) => setTimeout(r, 600));

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const clearButton = screen.getByLabelText("Clear search");
    fireEvent.click(clearButton);

    expect(input.value).toBe("");
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });
});
