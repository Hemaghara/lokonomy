import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminBusinessVerification from "../../admin/AdminBusinessVerification";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { useConfirm } from "../../../context/ConfirmContext";

// Mock adminService
vi.mock("../../../services", () => ({
  adminService: {
    getPendingVerifications: vi.fn(),
    approveBusiness: vi.fn(),
    rejectBusiness: vi.fn(),
    markVerificationUnderReview: vi.fn(),
  },
}));

// Mock Confirm Context
vi.mock("../../../context/ConfirmContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useConfirm: vi.fn(),
  };
});

const mockVerificationData = {
  data: {
    businesses: [
      {
        _id: "b1",
        businessName: "Bakery One",
        category: "Bakery",
        verificationStatus: "pending",
        createdAt: new Date().toISOString(),
        ownerId: { name: "Owner A", email: "owner@a.com", _id: "u1" },
        address: "123 Main St",
        district: "Ahmedabad",
        taluka: "City Center",
        pincode: "380001",
        contactNumber: "1234567890",
        kycDocuments: ["doc1.jpg", "doc2.pdf"],
        logo: "logo.png",
      },
      {
        _id: "b2",
        businessName: "Tech Store",
        category: "Electronics",
        verificationStatus: "under_review",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago (urgent)
        ownerId: { name: "Owner B", email: "owner@b.com", _id: "u2" },
        address: "456 Tech Park",
        district: "Surat",
        taluka: "Adajan",
        pincode: "395009",
        contactNumber: "0987654321",
        kycDocuments: [], // No docs
      },
    ],
    stats: { pending: 1, under_review: 1, verified: 10, rejected: 2 },
  },
};

describe("AdminBusinessVerification Page", () => {
  const mockConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useConfirm.mockReturnValue(mockConfirm);
    adminService.getPendingVerifications.mockResolvedValue(
      mockVerificationData,
    );
    adminService.approveBusiness.mockResolvedValue({ data: { success: true } });
    adminService.rejectBusiness.mockResolvedValue({ data: { success: true } });
    adminService.markVerificationUnderReview.mockResolvedValue({
      data: { success: true },
    });
    vi.spyOn(window, "open").mockImplementation(() => {});
  });

  it("renders loading state initially", async () => {
    let resolvePromise;
    adminService.getPendingVerifications.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { container } = render(<AdminBusinessVerification />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();

    resolvePromise(mockVerificationData);
    await waitFor(() =>
      expect(screen.getAllByText("Bakery One")[0]).toBeDefined(),
    );
  });

  it("renders verification queue and stats", async () => {
    render(<AdminBusinessVerification />);

    await waitFor(() => {
      expect(screen.getAllByText("Bakery One")[0]).toBeDefined();
      expect(screen.getAllByText("Pending")[0]).toBeDefined(); // actually renders 'pending' uppercase in ui but check exact
      expect(screen.getByText("Tech Store")).toBeInTheDocument();
      // Stats
      expect(screen.getByText("10")).toBeInTheDocument(); // Verified Total
      expect(screen.getByText("2")).toBeInTheDocument(); // Rejected
    });
  });

  it("selects a business and shows details", async () => {
    render(<AdminBusinessVerification />);

    await waitFor(() => screen.getAllByText("Bakery One")[0]);

    fireEvent.click(screen.getAllByText("Bakery One")[0]);

    await waitFor(() => {
      expect(screen.getAllByText("Verification Documents")[0]).toBeDefined();
      expect(screen.getAllByText("123 Main St")[0]).toBeDefined();
      expect(screen.getByText(/owner@a.com/)).toBeInTheDocument();
    });
  });

  it("handles business approval successfully", async () => {
    mockConfirm.mockResolvedValue(true);
    render(<AdminBusinessVerification />);

    await waitFor(() => screen.getAllByText("Bakery One")[0]);
    fireEvent.click(screen.getAllByText("Bakery One")[0]);

    await waitFor(
      () => screen.getAllByRole("button", { name: /Approve & Verify/i })[0],
    );

    const approveBtn = screen.getAllByRole("button", {
      name: /Approve & Verify/i,
    })[0];
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(adminService.approveBusiness).toHaveBeenCalledWith("b1");
    });
  });

  it("cancels business approval", async () => {
    mockConfirm.mockResolvedValue(false);
    render(<AdminBusinessVerification />);

    await waitFor(() => screen.getAllByText("Bakery One")[0]);
    fireEvent.click(screen.getAllByText("Bakery One")[0]);

    await waitFor(
      () => screen.getAllByRole("button", { name: /Approve & Verify/i })[0],
    );

    const approveBtn = screen.getAllByRole("button", {
      name: /Approve & Verify/i,
    })[0];
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(adminService.approveBusiness).not.toHaveBeenCalled();
    });
  });

  it("handles business rejection with reason", async () => {
    render(<AdminBusinessVerification />);

    await waitFor(() => screen.getAllByText("Bakery One")[0]);
    fireEvent.click(screen.getAllByText("Bakery One")[0]);

    await waitFor(
      () => screen.getAllByRole("button", { name: /Reject Verification/i })[0],
    );

    const rejectBtn = screen.getAllByRole("button", {
      name: /Reject Verification/i,
    })[0];
    fireEvent.click(rejectBtn);

    // Rejection modal should show
    await waitFor(() =>
      screen.getByPlaceholderText(/e.g. Identity documents are blurred/i),
    );

    const reasonInput = screen.getByPlaceholderText(
      /e.g. Identity documents are blurred/i,
    );
    fireEvent.change(reasonInput, { target: { value: "Invalid documents" } });

    const confirmRejectBtn = screen.getAllByRole("button", {
      name: /Confirm Rejection/i,
    })[0];
    fireEvent.click(confirmRejectBtn);

    await waitFor(() => {
      expect(adminService.rejectBusiness).toHaveBeenCalledWith(
        "b1",
        "Invalid documents",
      );
    });
  });

  it("does not reject business if reason is empty", async () => {
    render(<AdminBusinessVerification />);

    await waitFor(() => screen.getAllByText("Bakery One")[0]);
    fireEvent.click(screen.getAllByText("Bakery One")[0]);

    await waitFor(
      () => screen.getAllByRole("button", { name: /Reject Verification/i })[0],
    );

    const rejectBtn = screen.getAllByRole("button", {
      name: /Reject Verification/i,
    })[0];
    fireEvent.click(rejectBtn);

    await waitFor(() =>
      screen.getByPlaceholderText(/e.g. Identity documents are blurred/i),
    );

    const confirmRejectBtn = screen.getAllByRole("button", {
      name: /Confirm Rejection/i,
    })[0];
    fireEvent.click(confirmRejectBtn);

    expect(adminService.rejectBusiness).not.toHaveBeenCalled();
  });

  it("handles marking verification under review", async () => {
    render(<AdminBusinessVerification />);

    await waitFor(() => screen.getAllByText("Bakery One")[0]);
    fireEvent.click(screen.getAllByText("Bakery One")[0]);

    await waitFor(() => {
      // Find the eye icon button for mark review
      const reviewBtns = screen
        .getAllByRole("button")
        .filter((btn) =>
          btn.className.includes("p-2.5 rounded-xl bg-slate-800"),
        );
      fireEvent.click(reviewBtns[0]);
    });

    await waitFor(() => {
      expect(adminService.markVerificationUnderReview).toHaveBeenCalledWith(
        "b1",
      );
    });
  });

  it("handles opening and closing document lightbox for images", async () => {
    render(<AdminBusinessVerification />);

    await waitFor(() => screen.getAllByText("Bakery One")[0]);
    fireEvent.click(screen.getAllByText("Bakery One")[0]);

    await waitFor(() => screen.getByAltText("KYC Document 1"));

    const imgDoc = screen.getByAltText("KYC Document 1");
    fireEvent.click(imgDoc); // Click the image document

    // Lightbox should open
    await waitFor(() => {
      const lightboxImg = screen.getAllByAltText("KYC Document")[0];
      expect(lightboxImg).toBeInTheDocument();
      expect(lightboxImg.src).toContain("doc1.jpg");
    });

    // Close lightbox
    const closeBtn = screen
      .getAllByRole("button")
      .find((btn) => btn.className.includes("absolute top-6 right-6"));
    fireEvent.click(closeBtn);

    await waitFor(() => {
      // The one in lightbox has alt "KYC Document", thumbnail has "KYC Document 1"
      expect(screen.queryByAltText("KYC Document")).not.toBeInTheDocument();
    });
  });

  it("handles opening non-image document in new tab", async () => {
    render(<AdminBusinessVerification />);

    await waitFor(() => screen.getAllByText("Bakery One")[0]);
    fireEvent.click(screen.getAllByText("Bakery One")[0]);

    await waitFor(() => screen.getByText("View Doc"));

    const viewDocBtn = screen.getByText("View Doc");
    fireEvent.click(viewDocBtn.parentElement);

    expect(window.open).toHaveBeenCalledWith("doc2.pdf", "_blank");
  });

  it("shows no documents message when kycDocuments is empty", async () => {
    render(<AdminBusinessVerification />);

    await waitFor(() => screen.getByText("Tech Store"));
    fireEvent.click(screen.getByText("Tech Store"));

    await waitFor(() => {
      expect(screen.getByText("No documents uploaded")).toBeInTheDocument();
    });
  });

  it("handles empty state when no pending verifications", async () => {
    adminService.getPendingVerifications.mockResolvedValueOnce({
      data: {
        businesses: [],
        stats: { pending: 0, under_review: 0, verified: 0, rejected: 0 },
      },
    });
    render(<AdminBusinessVerification />);

    await waitFor(() => {
      expect(
        screen.getByText("Verification queue is empty"),
      ).toBeInTheDocument();
    });
  });

  it("handles API error when fetching data", async () => {
    adminService.getPendingVerifications.mockRejectedValueOnce(
      new Error("Failed to fetch"),
    );
    render(<AdminBusinessVerification />);

    await waitFor(() => {
      expect(adminService.getPendingVerifications).toHaveBeenCalled();
      // Since it fails, it defaults to empty array
      expect(
        screen.getByText("Verification queue is empty"),
      ).toBeInTheDocument();
    });
  });
});
