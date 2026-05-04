import { render, screen } from "../../utils/test-utils";
import ProtectedRoute from "../ProtectedRoute";
import { describe, it, expect, vi } from "vitest";
import { useAuth } from "../../hooks/useAuth";
import { BrowserRouter, Route, Routes } from "react-router-dom";

vi.mock("../../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

// No helper needed as test-utils render already wraps in MemoryRouter

describe("ProtectedRoute Component", () => {
  it("redirects to home if not authenticated", () => {
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <Routes>
        <Route path="/protected" element={<ProtectedRoute />}>
          <Route
            path="/protected"
            element={
              <div data-testid="protected-content">Protected Content</div>
            }
          />
        </Route>
        <Route path="/" element={<div data-testid="home">Home</div>} />
      </Routes>,
      { initialEntries: ["/protected"] }
    );

    expect(screen.getByTestId("home")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("renders outlet if authenticated", () => {
    useAuth.mockReturnValue({ isAuthenticated: true });

    render(
      <Routes>
        <Route path="/" element={<ProtectedRoute />}>
          <Route
            index
            element={
              <div data-testid="protected-content">Protected Content</div>
            }
          />
        </Route>
      </Routes>
    );

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
  });
});
