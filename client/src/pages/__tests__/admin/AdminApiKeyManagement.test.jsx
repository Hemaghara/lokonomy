import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminApiKeyManagement from "../../admin/AdminApiKeyManagement";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

vi.mock("../../../services", () => ({
  adminService: {
    getApiKeys: vi.fn(),
    createApiKey: vi.fn(),
    revokeApiKey: vi.fn(),
    deleteApiKey: vi.fn(),
    getApiKeyLogs: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("AdminApiKeyManagement Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.window.confirm = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });
  });

  const mockKeys = [
    {
      _id: "1",
      name: "Test Key Active",
      prefix: "abc",
      scopes: ["users:read"],
      status: "active",
      usageCount: 10,
      rateLimit: 1000,
      lastUsed: new Date().toISOString(),
    },
    {
      _id: "2",
      name: "Test Key Revoked",
      prefix: "def",
      scopes: [],
      status: "revoked",
      usageCount: 0,
      rateLimit: 1000,
      lastUsed: null,
    },
  ];

  it("renders loading state initially", () => {
    adminService.getApiKeys.mockReturnValue(new Promise(() => {}));
    const { container } = render(<AdminApiKeyManagement />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("fetches and renders api keys", async () => {
    adminService.getApiKeys.mockResolvedValueOnce({ data: mockKeys });
    render(<AdminApiKeyManagement />);

    await waitFor(() => {
      expect(adminService.getApiKeys).toHaveBeenCalled();
      expect(screen.getByText("Test Key Active")).toBeInTheDocument();
      expect(screen.getByText("Test Key Revoked")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Revoked")).toBeInTheDocument();
    });
  });

  it("handles empty state", async () => {
    adminService.getApiKeys.mockResolvedValueOnce({ data: [] });
    render(<AdminApiKeyManagement />);

    await waitFor(() => {
      expect(screen.getByText("No API Keys Issued")).toBeInTheDocument();
    });
  });

  it("opens and closes create modal", async () => {
    adminService.getApiKeys.mockResolvedValueOnce({ data: [] });
    render(<AdminApiKeyManagement />);

    await waitFor(() => {
      expect(screen.getByText("No API Keys Issued")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: /Generate Key/i })[0]);
    expect(screen.getByText("Issue API Key")).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Issue API Key")).not.toBeInTheDocument();
  });

  it("creates a new api key successfully", async () => {
    adminService.getApiKeys.mockResolvedValueOnce({ data: [] });
    adminService.createApiKey.mockResolvedValueOnce({
      data: { apiKey: { key: "secret-key-123" } },
    });

    render(<AdminApiKeyManagement />);

    await waitFor(() => {
      expect(screen.getByText("No API Keys Issued")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: /Generate Key/i })[0]);

    fireEvent.change(
      screen.getByPlaceholderText(/e.g. Analytics Dashboard Integration/i),
      { target: { value: "New Test Key" } },
    );
    fireEvent.click(screen.getByText("users:read")); // toggle scope

    const submitBtn = screen.getAllByRole("button", { name: /Generate Key/i })[1];
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(adminService.createApiKey).toHaveBeenCalledWith({
        name: "New Test Key",
        scopes: ["users:read"],
        rateLimit: 1000,
        expiresAt: "",
      });
      expect(screen.getByText("New API Key Generated")).toBeInTheDocument();
      expect(screen.getByText("secret-key-123")).toBeInTheDocument();
    });

    // Test clipboard copy
    const copyBtn = screen.getByText("secret-key-123").nextElementSibling;
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "secret-key-123",
    );
    expect(toast.success).toHaveBeenCalledWith("Copied to clipboard!");

    // Close the key viewer
    fireEvent.click(screen.getByText("I've Saved the Key"));
    expect(screen.queryByText("New API Key Generated")).not.toBeInTheDocument();
  });

  it("handles api key creation error", async () => {
    adminService.getApiKeys.mockResolvedValueOnce({ data: [] });
    adminService.createApiKey.mockRejectedValueOnce(new Error("Failed"));

    render(<AdminApiKeyManagement />);
    await waitFor(() =>
      expect(screen.getByText("No API Keys Issued")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getAllByRole("button", { name: /Generate Key/i })[0]);
    fireEvent.change(
      screen.getByPlaceholderText(/e.g. Analytics Dashboard Integration/i),
      { target: { value: "New Test Key" } },
    );
    const submitBtn = screen.getAllByRole("button", { name: /Generate Key/i })[1];
    fireEvent.submit(submitBtn.closest("form"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to create key");
    });
  });

  it("handles key revocation", async () => {
    adminService.getApiKeys.mockResolvedValueOnce({ data: mockKeys });
    adminService.revokeApiKey.mockResolvedValueOnce({});
    global.window.confirm.mockReturnValueOnce(true);

    render(<AdminApiKeyManagement />);
    await waitFor(() =>
      expect(screen.getByText("Test Key Active")).toBeInTheDocument(),
    );

    const revokeBtn = screen.getByTitle("Revoke Key");
    fireEvent.click(revokeBtn);

    expect(global.window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(adminService.revokeApiKey).toHaveBeenCalledWith("1");
      expect(toast.success).toHaveBeenCalledWith("API Key revoked");
    });
  });

  it("cancels key revocation if confirm is false", async () => {
    adminService.getApiKeys.mockResolvedValueOnce({ data: mockKeys });
    global.window.confirm.mockReturnValueOnce(false);

    render(<AdminApiKeyManagement />);
    await waitFor(() =>
      expect(screen.getByText("Test Key Active")).toBeInTheDocument(),
    );

    const revokeBtn = screen.getByTitle("Revoke Key");
    fireEvent.click(revokeBtn);

    expect(adminService.revokeApiKey).not.toHaveBeenCalled();
  });

  it("handles key deletion", async () => {
    adminService.getApiKeys.mockResolvedValueOnce({ data: mockKeys });
    adminService.deleteApiKey.mockResolvedValueOnce({});
    global.window.confirm.mockReturnValueOnce(true);

    render(<AdminApiKeyManagement />);
    await waitFor(() =>
      expect(screen.getByText("Test Key Active")).toBeInTheDocument(),
    );

    const deleteBtns = screen.getAllByTitle("Delete Key");
    fireEvent.click(deleteBtns[0]);

    expect(global.window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(adminService.deleteApiKey).toHaveBeenCalledWith("1");
      expect(toast.success).toHaveBeenCalledWith("API Key deleted");
    });
  });

  it("views api key logs", async () => {
    adminService.getApiKeys.mockResolvedValueOnce({ data: mockKeys });
    const mockLogs = {
      name: "Test Key Active",
      prefix: "abc",
      usageCount: 1,
      usageLogs: [
        {
          timestamp: new Date().toISOString(),
          method: "GET",
          endpoint: "/api/v1/users",
          statusCode: 200,
          ip: "127.0.0.1",
        },
      ],
    };
    adminService.getApiKeyLogs.mockResolvedValueOnce({ data: mockLogs });

    render(<AdminApiKeyManagement />);
    await waitFor(() =>
      expect(screen.getByText("Test Key Active")).toBeInTheDocument(),
    );

    const viewLogsBtn = screen.getAllByTitle("View Logs")[0];
    fireEvent.click(viewLogsBtn);

    await waitFor(() => {
      expect(adminService.getApiKeyLogs).toHaveBeenCalledWith("1");
      expect(
        screen.getByText(/Usage Logs: Test Key Active/i),
      ).toBeInTheDocument();
      expect(screen.getByText("/api/v1/users")).toBeInTheDocument();
      expect(screen.getByText("127.0.0.1")).toBeInTheDocument();
    });
  });

  it("views api key logs with empty array", async () => {
    adminService.getApiKeys.mockResolvedValueOnce({ data: mockKeys });
    const mockLogs = {
      name: "Test Key Active",
      prefix: "abc",
      usageCount: 0,
      usageLogs: [],
    };
    adminService.getApiKeyLogs.mockResolvedValueOnce({ data: mockLogs });

    render(<AdminApiKeyManagement />);
    await waitFor(() =>
      expect(screen.getByText("Test Key Active")).toBeInTheDocument(),
    );

    const viewLogsBtn = screen.getAllByTitle("View Logs")[0];
    fireEvent.click(viewLogsBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Usage Logs: Test Key Active/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText("No activity logs recorded yet"),
      ).toBeInTheDocument();
    });
  });

  it("handles api key logs error", async () => {
    adminService.getApiKeys.mockResolvedValueOnce({ data: mockKeys });
    adminService.getApiKeyLogs.mockRejectedValueOnce(new Error("Failed"));

    render(<AdminApiKeyManagement />);
    await waitFor(() =>
      expect(screen.getByText("Test Key Active")).toBeInTheDocument(),
    );

    const viewLogsBtn = screen.getAllByTitle("View Logs")[0];
    fireEvent.click(viewLogsBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load logs");
    });
  });
});
