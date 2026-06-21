import React from "react";
import { render, screen, fireEvent, waitFor, act } from "../../utils/test-utils";
import Login from "../Login";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "../../services";
import toast from "react-hot-toast";
import * as pushService from "../../services/pushService";

// Mock services
vi.mock("../../services", () => ({
  authService: {
    login: vi.fn(),
    verifyOtp: vi.fn(),
    resendOtp: vi.fn(),
    getMe: vi.fn().mockResolvedValue({ data: { success: false } }),
  },
}));

vi.mock("../../services/pushService", () => ({
  subscribeToPush: vi.fn().mockResolvedValue(undefined),
}));

const mockLogin = vi.hoisted(() => vi.fn());
vi.mock("../../context/UserContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useUser: () => ({
      login: mockLogin,
      user: null,
    }),
  };
});

const mockToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
}));

vi.mock("react-hot-toast", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    toast: mockToast,
    default: mockToast,
  };
});


const mockGeolocation = {
  getCurrentPosition: vi.fn().mockImplementation((success) =>
    success({
      coords: {
        latitude: 12.3456,
        longitude: 56.789,
        accuracy: 15,
      },
    }),
  ),
};
global.navigator.geolocation = mockGeolocation;

// Mock fetch for reverse geocoding
global.fetch = vi.fn().mockResolvedValue({
  json: vi.fn().mockResolvedValue({
    display_name: "Test City, Mumbai, Maharashtra, India",
    address: { state_district: "Mumbai", suburb: "Andheri" },
  }),
});

describe("Login Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders initial credentials step", () => {
    render(<Login />);
    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/name@example.com/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••••••/i)).toBeInTheDocument();
  });

  it("handles GPS authorization flow successfully", async () => {
    render(<Login />);

    const authorizeBtn = screen.getByRole("button", { name: /Authorize/i });
    fireEvent.click(authorizeBtn);

    expect(screen.getByText(/Detecting Location/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Access Verified/i)).toBeInTheDocument();
      expect(screen.getByText(/Test City/i)).toBeInTheDocument();
    });
  });

  it("handles GPS authorization permission denied", async () => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce(
      (success, error) => error({ code: 1, PERMISSION_DENIED: 1 }),
    );

    render(<Login />);
    fireEvent.click(screen.getByRole("button", { name: /Authorize/i }));

    await waitFor(() => {
      expect(screen.getByText(/GPS Access Denied/i)).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith("Location access denied.");
    });
  });

  it("handles GPS authorization generic error", async () => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce(
      (success, error) => error({ code: 2 }), // POSITION_UNAVAILABLE
    );

    render(<Login />);
    fireEvent.click(screen.getByRole("button", { name: /Authorize/i }));

    await waitFor(() => {
      expect(screen.getByText(/Detection Failed/i)).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith("Could not fetch location.");
    });
  });

  it("handles browser geocoding failure", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network Error"));
    render(<Login />);

    fireEvent.click(screen.getByRole("button", { name: /Authorize/i }));

    await waitFor(() => {
      expect(screen.getByText(/Access Verified/i)).toBeInTheDocument();
      // Should show coordinates if geocoding fails
      expect(screen.getByText(/12.3456, 56.7890/i)).toBeInTheDocument();
    });
  });

  it("submits credentials and moves to OTP step", async () => {
    authService.login.mockResolvedValue({
      data: { success: true, step: "otp", devOtp: "123456" },
    });

    render(<Login />);

    // Fill fields
    fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••••••/i), {
      target: { value: "password123" },
    });

    // Sign in WITHOUT GPS (GPS is now optional)
    fireEvent.submit(screen.getByPlaceholderText(/name@example.com/i).closest("form"));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@example.com",
          locationPermission: "denied",
        }),
      );
      expect(screen.getByText("Security Check")).toBeInTheDocument();
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Verification Code: 123456"),
        expect.any(Object),
      );
    });
  });

  it("handles login failure", async () => {
    authService.login.mockResolvedValue({
      data: { success: false, message: "Invalid credentials" },
    });

    render(<Login />);
    fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••••••/i), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Authorize/i }));
    await waitFor(() => screen.getByText(/Access Verified/i));

    fireEvent.submit(screen.getByRole("button", { name: /Sign In Now/i }).closest("form"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
    });
  });

  it("verifies OTP and navigates to home", async () => {
    authService.login.mockResolvedValue({
      data: { success: true, step: "otp" },
    });
    authService.verifyOtp.mockResolvedValue({
      data: {
        success: true,
        user: { _id: "u1", name: "Test User" },
        token: "t1",
      },
    });

    render(<Login />);
    // Transition to OTP
    fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••••••/i), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Authorize/i }));
    await waitFor(() => screen.getByText(/Access Verified/i));
    fireEvent.submit(screen.getByRole("button", { name: /Sign In Now/i }).closest("form"));

    await waitFor(() => screen.getByPlaceholderText("000000"));

    const otpInput = screen.getByPlaceholderText("000000");

    // Test invalid OTP length
    fireEvent.change(otpInput, { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: /Verify Account/i }));
    expect(toast.error).toHaveBeenCalledWith("Invalid verification code");

    // Valid OTP
    fireEvent.change(otpInput, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /Verify Account/i }));

    await waitFor(() => {
      expect(authService.verifyOtp).toHaveBeenCalledWith({
        email: "test@example.com",
        otp: "123456",
      });
      expect(toast.success).toHaveBeenCalledWith("Login successful!");
      expect(pushService.subscribeToPush).toHaveBeenCalled();
    });
  });

  it("handles OTP verification failure", async () => {
    authService.login.mockResolvedValue({
      data: { success: true, step: "otp" },
    });
    authService.verifyOtp.mockResolvedValue({
      data: { success: false, message: "Wrong OTP" },
    });

    render(<Login />);
    // Get to OTP step... (skipping steps for brevity in thought, but full in test)
    fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••••••/i), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Authorize/i }));
    await waitFor(() => screen.getByText(/Access Verified/i));
    fireEvent.submit(screen.getByRole("button", { name: /Sign In Now/i }).closest("form"));

    await waitFor(() => screen.getByPlaceholderText("000000"));
    fireEvent.change(screen.getByPlaceholderText("000000"), {
      target: { value: "111111" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Verify Account/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Wrong OTP");
    });
  });

  it("handles resend OTP with timer", async () => {
    authService.login.mockResolvedValue({
      data: { success: true, step: "otp" },
    });

    render(<Login />);
    fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••••••/i), {
      target: { value: "pass" },
    });
    
    // GPS
    fireEvent.click(screen.getByRole("button", { name: /Authorize/i }));
    await screen.findByText(/Access Verified/i);
    
    fireEvent.click(screen.getByRole("button", { name: /Sign In Now/i }));

    await screen.findByText("Security Check");
    
    expect(screen.getByText(/RESEND CODE IN/i)).toBeInTheDocument();
  });

  it("allows going back to credentials step", async () => {
    authService.login.mockResolvedValue({
      data: { success: true, step: "otp" },
    });
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••••••/i), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Authorize/i }));
    await waitFor(() => screen.getByText(/Access Verified/i));
    fireEvent.submit(screen.getByRole("button", { name: /Sign In Now/i }).closest("form"));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalled();
      expect(screen.getByText("Security Check")).toBeInTheDocument();
    });

    const backBtn = await screen.findByRole("button", { name: /Change Login Email/i });
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    });
  });

  it("shows error if fields are empty", async () => {
    render(<Login />);
    fireEvent.submit(screen.getByRole("button", { name: /Sign In Now/i }).closest("form"));
    expect(toast.error).toHaveBeenCalledWith("Please fill all fields");
  });

  it("shows error toast if redirect query param expired=true is present", () => {
    render(<Login />, { initialEntries: ["/?expired=true"] });
    expect(toast.error).toHaveBeenCalledWith("Session expired. Please login again.");
  });
});
