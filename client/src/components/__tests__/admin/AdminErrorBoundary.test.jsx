import { render, screen, fireEvent } from "../../../utils/test-utils";
import AdminErrorBoundary from "../../admin/AdminErrorBoundary";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ThrowError = ({ message = "Test error" }) => {
  throw new Error(message);
};

describe("AdminErrorBoundary Component", () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders children when no error occurs", () => {
    render(
      <AdminErrorBoundary>
        <div data-testid="child">Child Content</div>
      </AdminErrorBoundary>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders error UI when a child throws an error", () => {
    render(
      <AdminErrorBoundary>
        <ThrowError />
      </AdminErrorBoundary>,
    );

    expect(screen.getByText(/Return to Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Crash/i)).toBeInTheDocument();
    expect(
      screen.getByText(/An unexpected error occurred/i),
    ).toBeInTheDocument();
  });

  it("displays the specific error message", () => {
    const errorMessage = "CRITICAL FAILURE";
    render(
      <AdminErrorBoundary>
        <ThrowError message={errorMessage} />
      </AdminErrorBoundary>,
    );

    expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
  });

  it("logs the error to console", () => {
    render(
      <AdminErrorBoundary>
        <ThrowError />
      </AdminErrorBoundary>,
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Admin Dashboard Error:"),
      expect.any(Error),
      expect.any(Object),
    );
  });

  it("calls handleReset and redirects on button click", () => {
    const locationMock = {
      href: "http://localhost/",
      pathname: "/",
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
      toString: () => "http://localhost/",
    };

    vi.stubGlobal("location", locationMock);

    render(
      <AdminErrorBoundary>
        <ThrowError />
      </AdminErrorBoundary>,
    );

    const resetButton = screen.getByRole("button", {
      name: /Return to Dashboard/i,
    });
    fireEvent.click(resetButton);

    expect(locationMock.href).toBe("/admin/dashboard");
  });
});
