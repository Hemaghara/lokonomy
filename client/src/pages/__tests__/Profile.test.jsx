import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import Profile from "../Profile";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  authService,
  businessService,
  jobService,
  referralService,
  subscriptionService,
} from "../../services";
import { toast } from "react-hot-toast";

const mockUser = { id: "mock-user-id", name: "Test User" };
const mockLogout = vi.fn();
vi.mock("../../context/UserContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useUser: () => ({ 
      user: mockUser, 
      logout: mockLogout 
    }),
  };
});


// Mock services
vi.mock("../../services", () => ({
  authService: {
    updateProfile: vi.fn().mockResolvedValue({
      data: { success: true, user: { name: "New Name" } },
    }),
  },
  businessService: {
    getMyBusinesses: vi.fn().mockResolvedValue({
      data: [
        {
          _id: "b1",
          businessName: "My Shop",
          mainCategory: "Retail",
          district: "Ahmedabad",
        },
      ],
    }),
    deleteBusiness: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
  jobService: {
    getAppliedJobs: vi.fn().mockResolvedValue({
      data: [{ _id: "j1", jobTitle: "Developer", company: "Tech Inc" }],
    }),
  },
  referralService: {
    getMyReferralCode: vi
      .fn()
      .mockResolvedValue({ data: { referralCode: "REF123" } }),
  },
  subscriptionService: {
    getMySubscription: vi.fn().mockResolvedValue({ data: { plan: "Free" } }),
  },
}));

// Mock pushService
vi.mock("../../services/pushService", () => ({
  subscribeToPush: vi.fn(),
  unsubscribeFromPush: vi.fn(),
  toggleNotifications: vi.fn(),
  toggleAppointmentReminders: vi.fn(),
}));

// Mock hooks
vi.mock("../../hooks/usePlanLimits", () => ({
  usePlanLimits: () => ({
    limits: { businesses: 2, products: 10, jobs: 5 },
  }),
}));

describe("Profile Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders user profile information and handles updates", async () => {
    render(<Profile />);

    await waitFor(() => screen.getByPlaceholderText(/Your full name/i));

    const nameInput = screen.getByPlaceholderText(/Your full name/i);
    fireEvent.change(nameInput, { target: { value: "Updated Name" } });

    const saveBtn = screen.getByText(/Save Changes/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(authService.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Updated Name" }),
      );
    });
  });

  it("handles Payment settings updates and QR upload", async () => {
    render(<Profile />);

    const payTab = screen.getAllByRole("button", { name: /Payments/i })[0];
    fireEvent.click(payTab);

    const upiInput = screen.getByPlaceholderText(/e\.g\. name@upi/i);
    fireEvent.change(upiInput, { target: { value: "test@upi" } });

    const bankInput = screen.getByPlaceholderText(
      /e\.g\. State Bank of India/i,
    );
    fireEvent.change(bankInput, { target: { value: "SBI" } });

    // Mock QR upload
    const file = new File(["(⌐□_□)"], "qr.png", { type: "image/png" });
    const qrInput = screen.getByLabelText(/Upload QR Code Image/i);

    // We need to mock FileReader
    let capturedReader;
    vi.stubGlobal(
      "FileReader",
      class {
        constructor() {
          capturedReader = this;
          this.readAsDataURL = vi.fn();
          this.result = "data:image/png;base64,mock";
        }
      },
    );


    fireEvent.change(qrInput, { target: { files: [file] } });
    capturedReader.onloadend();

    // Wait for state update (preview to appear)
    await waitFor(() => screen.getByAltText("QR Preview"));

    const saveBtn = screen.getByText(/Save Payment Details/i);

    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(authService.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          upiId: "test@upi",
          bankName: "SBI",
          paymentQrCode: "data:image/png;base64,mock",
        }),
      );
    });
  });

  it("handles business deletion with confirmation", async () => {
    window.confirm = vi.fn(() => true);
    render(<Profile />);

    const bizTab = screen.getAllByRole("button", { name: /Businesses/i })[0];
    fireEvent.click(bizTab);

    await waitFor(() => screen.getByText("My Shop"));

    const deleteBtn = screen.getByTitle("Delete Business");
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(businessService.deleteBusiness).toHaveBeenCalledWith("b1");
    });
  });

  it("handles Referrals tab interactions", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(<Profile />);

    const refTab = screen.getAllByRole("button", { name: /Referrals/i })[0];
    fireEvent.click(refTab);

    await waitFor(() => screen.getByText("REF123"));

    const copyBtn = screen.getByRole("button", { name: /Copy/i });
    fireEvent.click(copyBtn);


    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("REF123");
  });

  it("handles Settings toggles for notifications and reminders", async () => {
    const { toggleNotifications, toggleAppointmentReminders } =
      await import("../../services/pushService");

    render(<Profile />);

    const settingsTab = screen.getAllByRole("button", { name: /Settings/i })[0];
    fireEvent.click(settingsTab);

    const notifyToggle = screen.getByLabelText(/Push Notifications/i);
    fireEvent.click(notifyToggle);
    await waitFor(() => expect(toggleNotifications).toHaveBeenCalled());

    const reminderToggle = screen.getByLabelText(/Appointment Reminders/i);
    fireEvent.click(reminderToggle);
    await waitFor(() => expect(toggleAppointmentReminders).toHaveBeenCalled());

  });

  it("handles GPS refresh in Location tab", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: vi.fn().mockImplementation((success) =>
          success({
            coords: { latitude: 10.1, longitude: 20.2 },
          }),
        ),
      },
    });
    // Mock reverse geocoding fetch
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            display_name: "Mock Address",
            address: { city: "Mock City" },
          }),
      }),
    );

    render(<Profile />);

    const locTab = screen.getAllByRole("button", { name: /Location/i })[0];
    fireEvent.click(locTab);

    const refreshBtn = screen.getByText(/Update to Current Location/i);
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
      expect(authService.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 10.1,
          locationName: "Mock Address",
        }),
      );
    });
  });

  it("handles logout", async () => {
    render(<Profile />);

    const logoutBtn = screen.getAllByTitle("Logout")[0];
    fireEvent.click(logoutBtn);


    expect(mockLogout).toHaveBeenCalled();
  });
});
