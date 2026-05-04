import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import Register from "../Register";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService, referralService } from "../../services";
import { toast } from "react-hot-toast";

// Mock services
vi.mock("../../services", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    authService: {
      ...actual.authService,
      register: vi.fn().mockResolvedValue({
        data: {
          success: true,
          token: "mock-token",
          user: { name: "New User", email: "new@example.com" },
        },
      }),
    },
    referralService: {
      ...actual.referralService,
      validateReferralCode: vi.fn().mockResolvedValue({
        data: { success: true, referrerName: "Alice" },
      }),
    },
  };
});

// Redundant toast mock removed to use global mock from vitest.setup.js

describe("Register Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders registration form and handles successful submission", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: vi.fn().mockImplementation((success) =>
          success({
            coords: { latitude: 12.34, longitude: 56.78, accuracy: 10 },
          }),
        ),
      },
    });

    render(<Register />);

    // Fill fields
    fireEvent.change(screen.getByPlaceholderText(/John Doe/i), {
      target: { value: "John Smith" },
    });
    fireEvent.change(screen.getByPlaceholderText(/john@example.com/i), {
      target: { value: "jsmith@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Create Password/i), {
      target: { value: "secure123" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "secure123" },
    });

    // GPS Section
    const gpsBtn = screen.getByRole("button", { name: /Allow GPS/i });
    fireEvent.click(gpsBtn);

    await waitFor(() => {
      expect(screen.getByText(/Location Captured/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", {
      name: /Register Citizen Node/i,
    });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "John Smith",
          email: "jsmith@example.com",
          latitude: 12.34,
        }),
      );
    });
  });

  it("validates password matching", async () => {
    render(<Register />);

    fireEvent.change(screen.getByLabelText(/Create Password/i), {
      target: { value: "pass123" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "pass456" },
    });

    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText(/John Doe/i), {
      target: { value: "John Smith" },
    });
    fireEvent.change(screen.getByPlaceholderText(/john@example.com/i), {
      target: { value: "jsmith@example.com" },
    });

    // Grant GPS to enable submit button
    const mockGps = vi.fn((success) =>
      success({ coords: { latitude: 0, longitude: 0 } }),
    );
    vi.stubGlobal("navigator", {
      geolocation: { getCurrentPosition: mockGps },
    });
    fireEvent.click(screen.getByRole("button", { name: /Allow GPS/i }));

    const submitBtn = await screen.findByRole("button", {
      name: /Register Citizen Node/i,
    });
    fireEvent.click(submitBtn);

    expect(toast.error).toHaveBeenCalledWith("Passwords do not match.");
  });

  it("validates password length", async () => {
    render(<Register />);

    fireEvent.change(screen.getByLabelText(/Create Password/i), {
      target: { value: "123" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "123" },
    });

    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText(/John Doe/i), {
      target: { value: "John Smith" },
    });
    fireEvent.change(screen.getByPlaceholderText(/john@example.com/i), {
      target: { value: "jsmith@example.com" },
    });

    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (s) => s({ coords: { latitude: 0, longitude: 0 } }),
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Allow GPS/i }));

    const submitBtn = await screen.findByRole("button", {
      name: /Register Citizen Node/i,
    });
    fireEvent.click(submitBtn);

    expect(toast.error).toHaveBeenCalledWith(
      "Password must be at least 6 characters.",
    );
  });

  it("handles GPS denial gracefully", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: vi.fn().mockImplementation((_, error) =>
          error({
            code: 1, // PERMISSION_DENIED
            PERMISSION_DENIED: 1,
          }),
        ),
      },
    });

    render(<Register />);

    fireEvent.click(screen.getByRole("button", { name: /Allow GPS/i }));

    await waitFor(() => {
      expect(screen.getByText(/GPS Required/i)).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("Location access denied"),
      );
    });
  });

  it("validates referral code from URL parameters", async () => {
    // Mock URL search params
    vi.mock("react-router-dom", async () => {
      const actual = await vi.importActual("react-router-dom");
      return {
        ...actual,
        useSearchParams: () => [new URLSearchParams("ref=ALICE123")],
      };
    });

    render(<Register />);

    await waitFor(() => {
      expect(referralService.validateReferralCode).toHaveBeenCalledWith(
        "ALICE123",
      );
      expect(
        screen.getByText(/You were invited by Alice!/i),
      ).toBeInTheDocument();
    });
  });
});
