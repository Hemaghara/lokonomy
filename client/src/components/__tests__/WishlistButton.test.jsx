import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import WishlistButton from "../WishlistButton";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { wishlistService } from "../../services";
import { useUser } from "../../context/UserContext";
import { toast } from "react-hot-toast";

vi.mock("../../services", () => ({
  wishlistService: {
    checkWishlistStatus: vi.fn(),
    toggleWishlist: vi.fn(),
  },
}));

vi.mock("../../context/UserContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useUser: vi.fn(),
  };
});

vi.mock("react-hot-toast", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    toast: {
      error: vi.fn(),
      success: vi.fn(),
    },
  };
});

describe("WishlistButton Component", () => {
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders unsaved state initially", () => {
    useUser.mockReturnValue({ user: null });
    render(<WishlistButton type="product" id="1" />);
    // We can't easily query the exact react-icon by name, but we know the button exists
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("checks status on mount if user and id exist", async () => {
    useUser.mockReturnValue({ user: { id: "u1" } });
    wishlistService.checkWishlistStatus.mockResolvedValueOnce({
      isSaved: true,
    });

    render(<WishlistButton type="product" id="1" />);

    expect(wishlistService.checkWishlistStatus).toHaveBeenCalledWith(
      "product",
      "1",
    );

    // Wait for the state to update
    await waitFor(() => {
      const button = screen.getByRole("button");
      expect(button.className).toContain("text-rose-500"); // Class applied when isSaved is true
    });
  });

  it("shows error if not logged in on click", async () => {
    useUser.mockReturnValue({ user: null });

    render(<WishlistButton type="product" id="1" />);

    fireEvent.click(screen.getByRole("button"));

    expect(toast.error).toHaveBeenCalledWith("Please login to save items");
    expect(wishlistService.toggleWishlist).not.toHaveBeenCalled();
  });

  it("toggles wishlist successfully", async () => {
    useUser.mockReturnValue({ user: { id: "u1" } });
    wishlistService.checkWishlistStatus.mockResolvedValueOnce({
      isSaved: false,
    });
    wishlistService.toggleWishlist.mockResolvedValueOnce({
      isSaved: true,
      message: "Added to wishlist",
    });

    render(<WishlistButton type="product" id="1" onToggle={mockOnToggle} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Expect button to be disabled during loading
    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(wishlistService.toggleWishlist).toHaveBeenCalledWith(
        "product",
        "1",
      );
      expect(toast.success).toHaveBeenCalledWith("Added to wishlist");
      expect(mockOnToggle).toHaveBeenCalledWith(true);
      expect(button.className).toContain("text-rose-500"); // Updates style
      expect(button).not.toBeDisabled();
    });
  });

  it("handles toggle error gracefully", async () => {
    useUser.mockReturnValue({ user: { id: "u1" } });
    wishlistService.checkWishlistStatus.mockResolvedValueOnce({
      isSaved: false,
    });
    wishlistService.toggleWishlist.mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(<WishlistButton type="product" id="1" />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to update wishlist");
      expect(screen.getByRole("button")).not.toBeDisabled();
    });
  });

  it("handles checkStatus error gracefully", async () => {
    useUser.mockReturnValue({ user: { id: "u1" } });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    wishlistService.checkWishlistStatus.mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(<WishlistButton type="product" id="1" />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error checking wishlist status:",
        expect.any(Error),
      );
    });
    consoleSpy.mockRestore();
  });
});
