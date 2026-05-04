import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AdminSettings from "../../../pages/admin/AdminSettings";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

vi.mock("../../../services", () => ({
  adminService: {
    getPlatformSettings: vi.fn(),
    updatePlatformSettings: vi.fn(),
    toggleMaintenanceMode: vi.fn(),
  },
}));

vi.mock("../../../layouts/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockSettings = {
  maintenanceMode: false,
  seo: {
    homeTitle: "Lokonomy - Shop Local",
    homeMetaDescription: "Find the best local stores and products.",
  },
  socialLinks: {
    facebook: "https://facebook.com/lokonomy",
    instagram: "https://instagram.com/lokonomy",
    twitter: "https://twitter.com/lokonomy",
    youtube: "https://youtube.com/lokonomy",
    whatsapp: "+919876543210",
  },
  platformFees: {
    orderCommissionPercentage: 5,
    listingFee: 100,
  },
  moderation: {
    autoFlagThreshold: 5,
    autoNotifyAdmins: true,
  },
};

describe("AdminSettings Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <AdminSettings />
      </MemoryRouter>,
    );
  };

  it("renders loading state initially", () => {
    adminService.getPlatformSettings.mockImplementation(
      () => new Promise(() => {}),
    );
    renderComponent();
    expect(screen.getByTestId("admin-layout")).toBeInTheDocument();
  });

  it("fetches and displays platform settings successfully", async () => {
    adminService.getPlatformSettings.mockResolvedValue({ data: mockSettings });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Platform Settings")).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("support@lokonomy.com"),
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("+91 98765 43210")).toBeInTheDocument();
    });
  });

  it("handles error fetching settings", async () => {
    adminService.getPlatformSettings.mockRejectedValue(
      new Error("Fetch error"),
    );
    renderComponent();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch settings");
    });
  });

  it("switches to SEO tab and displays SEO settings", async () => {
    adminService.getPlatformSettings.mockResolvedValue({ data: mockSettings });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Platform Settings")).toBeInTheDocument();
    });

    const seoTab = screen.getByRole("button", { name: /SEO & Meta/i });
    fireEvent.click(seoTab);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("Lokonomy - Shop Local"),
      ).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("Find the best local stores and products."),
      ).toBeInTheDocument();
    });
  });

  it("switches to Social Config tab and displays social links", async () => {
    adminService.getPlatformSettings.mockResolvedValue({ data: mockSettings });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Platform Settings")).toBeInTheDocument();
    });

    const socialTab = screen.getByRole("button", { name: /Social Config/i });
    fireEvent.click(socialTab);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("https://facebook.com/lokonomy"),
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("+919876543210")).toBeInTheDocument();
    });
  });

  it("switches to Economics tab and displays fees", async () => {
    adminService.getPlatformSettings.mockResolvedValue({ data: mockSettings });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Platform Settings")).toBeInTheDocument();
    });

    const ecoTab = screen.getByRole("button", { name: /Economics/i });
    fireEvent.click(ecoTab);

    await waitFor(() => {
      expect(screen.getByDisplayValue("5")).toBeInTheDocument();
      expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    });
  });

  it("switches to Moderation Rules tab and displays moderation settings", async () => {
    adminService.getPlatformSettings.mockResolvedValue({ data: mockSettings });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Platform Settings")).toBeInTheDocument();
    });

    const modTab = screen.getByRole("button", { name: /Moderation Rules/i });
    fireEvent.click(modTab);

    await waitFor(() => {
      expect(screen.getByDisplayValue("5")).toBeInTheDocument();
      expect(screen.getByText("Admin Notifications")).toBeInTheDocument();
    });
  });

  it("updates settings on input change and saves", async () => {
    adminService.getPlatformSettings.mockResolvedValue({ data: mockSettings });
    adminService.updatePlatformSettings.mockResolvedValue({});
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Platform Settings")).toBeInTheDocument();
    });

    const seoTab = screen.getByRole("button", { name: /SEO & Meta/i });
    fireEvent.click(seoTab);

    const titleInput = await screen.findByDisplayValue("Lokonomy - Shop Local");
    fireEvent.change(titleInput, {
      target: { value: "Lokonomy - Local E-commerce" },
    });

    const saveBtn = screen.getByRole("button", { name: /Save Configuration/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(adminService.updatePlatformSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          seo: {
            homeTitle: "Lokonomy - Local E-commerce",
            homeMetaDescription: "Find the best local stores and products.",
          },
        }),
      );
      expect(toast.success).toHaveBeenCalledWith("Settings saved successfully");
    });
  });

  it("handles error saving settings", async () => {
    adminService.getPlatformSettings.mockResolvedValue({ data: mockSettings });
    adminService.updatePlatformSettings.mockRejectedValue(
      new Error("Save error"),
    );
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Platform Settings")).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole("button", { name: /Save Configuration/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to save settings");
    });
  });

  it("toggles maintenance mode", async () => {
    adminService.getPlatformSettings.mockResolvedValue({ data: mockSettings });
    adminService.toggleMaintenanceMode.mockResolvedValue({
      data: { settings: { ...mockSettings, maintenanceMode: true } },
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Platform Settings")).toBeInTheDocument();
    });

    const maintBtn = screen.getByRole("button", { name: /Maintenance: OFF/i });
    fireEvent.click(maintBtn);

    await waitFor(() => {
      expect(adminService.toggleMaintenanceMode).toHaveBeenCalled();
      expect(
        screen.getByRole("button", { name: /Maintenance: ON/i }),
      ).toBeInTheDocument();
      expect(toast.success).toHaveBeenCalledWith("Maintenance mode activated");
    });
  });

  it("handles error toggling maintenance mode", async () => {
    adminService.getPlatformSettings.mockResolvedValue({ data: mockSettings });
    adminService.toggleMaintenanceMode.mockRejectedValue(
      new Error("Toggle error"),
    );
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Platform Settings")).toBeInTheDocument();
    });

    const maintBtn = screen.getByRole("button", { name: /Maintenance: OFF/i });
    fireEvent.click(maintBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Toggle failed");
    });
  });

  it("toggles auto notify admins moderation setting", async () => {
    adminService.getPlatformSettings.mockResolvedValue({ data: mockSettings });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Platform Settings")).toBeInTheDocument();
    });

    const modTab = screen.getByRole("button", { name: /Moderation Rules/i });
    fireEvent.click(modTab);

    // There's a button for toggle
    const toggleBtns = await screen.findAllByRole("button");
    const toggleBtn = toggleBtns[toggleBtns.length - 1]; // usually the last button in that tab
    fireEvent.click(toggleBtn);

    // Click save
    const saveBtn = screen.getByRole("button", { name: /Save Configuration/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(adminService.updatePlatformSettings).toHaveBeenCalled();
    });
  });
});
