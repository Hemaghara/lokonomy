import { render, screen, fireEvent } from "../../utils/test-utils";
import MediaImage from "../MediaImage";
import { describe, it, expect, vi } from "vitest";
import * as mediaUrlUtils from "../../utils/mediaUrl";

vi.mock("../../utils/mediaUrl", () => ({
  getMediaUrl: vi.fn(),
}));

describe("MediaImage Component", () => {
  it("renders with default props", () => {
    mediaUrlUtils.getMediaUrl.mockReturnValue("http://example.com/image.jpg");

    render(<MediaImage mediaId="123" />);

    expect(mediaUrlUtils.getMediaUrl).toHaveBeenCalledWith("123", "thumb");

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "http://example.com/image.jpg");
    expect(img).toHaveAttribute("alt", "Media");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveClass("object-cover");
  });

  it("renders with custom props", () => {
    mediaUrlUtils.getMediaUrl.mockReturnValue(
      "http://example.com/image_full.jpg",
    );

    render(
      <MediaImage
        mediaId="456"
        type="full"
        alt="Custom Alt"
        className="custom-class"
        data-testid="media-img"
      />,
    );

    expect(mediaUrlUtils.getMediaUrl).toHaveBeenCalledWith("456", "full");

    const img = screen.getByTestId("media-img");
    expect(img).toHaveAttribute("src", "http://example.com/image_full.jpg");
    expect(img).toHaveAttribute("alt", "Custom Alt");
    expect(img).toHaveClass("object-cover custom-class");
  });

  it("handles image load error by setting placeholder", () => {
    mediaUrlUtils.getMediaUrl.mockReturnValue(
      "http://example.com/bad_image.jpg",
    );

    render(<MediaImage mediaId="123" />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "http://example.com/bad_image.jpg");

    // Simulate error
    fireEvent.error(img);

    expect(img.src).toContain("/placeholders/missing.png");
  });
});
