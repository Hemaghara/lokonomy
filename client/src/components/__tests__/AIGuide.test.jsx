import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import AIGuide from "../AIGuide";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { askLocalGuide, businessService } from "../../services";

vi.mock("../../services", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    askLocalGuide: vi.fn(),
    businessService: { getBusinesses: vi.fn().mockResolvedValue({ data: [] }) },
    storyService: { getStories: vi.fn().mockResolvedValue({ data: [] }) },
    jobService: { getJobs: vi.fn().mockResolvedValue({ data: [] }) },
  };
});

vi.mock("../../context/UserContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useUser: () => ({ user: { id: "u1", name: "Test" } }),
  };
});

vi.mock("../../context/LocationContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useLocation: () => ({
      state: "State",
      district: "District",
      taluka: "Taluka",
      setState: vi.fn(),
      setDistrict: vi.fn(),
      setTaluka: vi.fn(),
    }),
  };
});

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/" }),
    Link: ({ children, to }) => <a href={to}>{children}</a>,
  };
});

describe("AIGuide Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the floating button initially", () => {
    render(<AIGuide />);
    expect(screen.getByLabelText("Open chat")).toBeInTheDocument();
  });

  it("opens and closes chat window", async () => {
    render(<AIGuide />);
    fireEvent.click(screen.getByLabelText("Open chat"));
    expect(screen.getByText("Local Guide")).toBeInTheDocument();

    // Close window
    const closeBtn = screen
      .getAllByRole("button")
      .find((b) => b.innerHTML.includes('polyline points="18 6 6 18"')); // X icon
    if (closeBtn) fireEvent.click(closeBtn);
    else fireEvent.click(screen.getAllByRole("button")[2]); // fallback

    await waitFor(() => {
      expect(screen.queryByText("Local Guide")).not.toBeInTheDocument();
    });
  });

  it("minimizes and maximizes the chat window", async () => {
    render(<AIGuide />);
    fireEvent.click(screen.getByLabelText("Open chat"));

    const minimizeBtn = screen.getAllByRole("button")[1]; // minimize is usually 2nd
    fireEvent.click(minimizeBtn);

    // Once minimized, input shouldn't be there
    expect(
      screen.queryByPlaceholderText("Ask about businesses, jobs..."),
    ).not.toBeInTheDocument();

    // Maximize again
    fireEvent.click(minimizeBtn);
    expect(
      screen.getByPlaceholderText("Ask about businesses, jobs..."),
    ).toBeInTheDocument();
  });

  it("sends a message and handles the response", async () => {
    askLocalGuide.mockResolvedValue(
      "Here are some results: [[business:b1|Tech Shop]]",
    );
    render(<AIGuide />);
    fireEvent.click(screen.getByLabelText("Open chat"));

    const input = screen.getByPlaceholderText("Ask about businesses, jobs...");
    fireEvent.change(input, { target: { value: "Find a tech shop" } });

    // Press enter
    fireEvent.keyPress(input, { key: "Enter", code: "Enter", charCode: 13 });

    // Message should be added to UI
    await waitFor(() => {
      expect(screen.getByText("Find a tech shop")).toBeInTheDocument();
    });

    // Assistant response should eventually be added
    await waitFor(() => {
      expect(screen.getByText("Here are some results:")).toBeInTheDocument();
      expect(screen.getByText("Tech Shop")).toBeInTheDocument();
    });

    // Verify services called
    expect(businessService.getBusinesses).toHaveBeenCalled();
  });

  it("handles quick actions correctly", async () => {
    render(<AIGuide />);
    fireEvent.click(screen.getByLabelText("Open chat"));

    // Navigating quick action
    const sellAction = screen.getByText("Sell Product");
    fireEvent.click(sellAction);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/market/sell");
    });
  });

  it("handles errors gracefully during message send", async () => {
    askLocalGuide.mockRejectedValue(new Error("Network error"));
    render(<AIGuide />);
    fireEvent.click(screen.getByLabelText("Open chat"));

    const input = screen.getByPlaceholderText("Ask about businesses, jobs...");
    fireEvent.change(input, { target: { value: "Hello" } });

    // The button doesn't have a label, but the input has the placeholder.
    // The button is the next sibling or inside the same parent.
    // Easiest is to press Enter on the input.
    fireEvent.keyPress(input, { key: "Enter", code: "Enter", charCode: 13 });

    await waitFor(() => {
      expect(
        screen.getByText(/trouble connecting to live data right now/i),
      ).toBeInTheDocument();
    });
  });

  it("handles geolocation auto-locate", async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementationOnce((success) =>
        success({
          coords: {
            latitude: 23.0225,
            longitude: 72.5714,
          },
        }),
      ),
    };

    vi.stubGlobal("navigator", { geolocation: mockGeolocation });

    // Mock fetch for reverse geocoding
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        address: {
          state: "Gujarat",
          state_district: "Ahmedabad District",
          city: "Ahmedabad",
        },
      }),
    });

    render(<AIGuide />);
    fireEvent.click(screen.getByLabelText("Open chat"));

    const locateBtn = screen.getByTitle("Detect my location");
    fireEvent.click(locateBtn);

    await waitFor(() => {
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    vi.unstubAllGlobals();
  });
});
