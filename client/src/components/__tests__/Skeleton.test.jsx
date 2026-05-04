import { render, screen } from "../../utils/test-utils";
import Skeleton, {
  CardSkeleton,
  ProductSkeleton,
  MarketSkeleton,
  BusinessDetailsSkeleton,
  ProductDetailsSkeleton,
} from "../Skeleton";
import { describe, it, expect } from "vitest";

describe("Skeleton Components", () => {
  it("renders default Skeleton component", () => {
    const { container } = render(<Skeleton className="custom-skel" />);
    const skel = container.firstChild;
    expect(skel).toHaveClass("skeleton");
    expect(skel).toHaveClass("custom-skel");
  });

  it("renders CardSkeleton", () => {
    const { container } = render(<CardSkeleton />);
    expect(container.querySelector(".card")).toBeInTheDocument();
    expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(0);
  });

  it("renders ProductSkeleton", () => {
    const { container } = render(<ProductSkeleton />);
    // Contains multiple skeleton lines
    expect(container.querySelectorAll(".skeleton").length).toBe(6);
  });

  it("renders MarketSkeleton", () => {
    const { container } = render(<MarketSkeleton />);
    // MarketSkeleton renders 8 ProductSkeletons
    // 8 * 6 = 48 skeleton elements
    expect(container.querySelectorAll(".skeleton").length).toBe(48);
  });

  it("renders BusinessDetailsSkeleton", () => {
    const { container } = render(<BusinessDetailsSkeleton />);
    expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(0);
  });

  it("renders ProductDetailsSkeleton", () => {
    const { container } = render(<ProductDetailsSkeleton />);
    expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(0);
  });
});
