import { render, screen } from "../../../utils/test-utils";
import {
  TableSkeleton,
  CardSkeleton,
  StatsSkeleton,
} from "../../admin/Skeleton";
import { describe, it, expect } from "vitest";

describe("Skeleton Components", () => {
  describe("TableSkeleton", () => {
    it("renders with default rows and columns", () => {
      const { container } = render(<TableSkeleton />);
      // Default rows: 8, cols: 6
      // Header has cols, Body has rows
      const headerCols = container.querySelectorAll(".bg-slate-950\\/30 .h-2");
      expect(headerCols.length).toBe(6);

      const tableRows = container.querySelectorAll(".divide-y > div");
      expect(tableRows.length).toBe(8);
    });

    it("renders with custom rows and columns", () => {
      const { container } = render(<TableSkeleton rows={12} cols={4} />);
      const headerCols = container.querySelectorAll(".bg-slate-950\\/30 .h-2");
      expect(headerCols.length).toBe(4);

      const tableRows = container.querySelectorAll(".divide-y > div");
      expect(tableRows.length).toBe(12);
    });

    it("has animation and correct structure", () => {
      const { container } = render(<TableSkeleton />);
      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
      expect(container.querySelector(".rounded-2xl")).toBeInTheDocument();
    });
  });

  describe("CardSkeleton", () => {
    it("renders with default count", () => {
      const { container } = render(<CardSkeleton />);
      // Default count: 6
      const cards = container.querySelectorAll(".bg-slate-900\\/50");
      expect(cards.length).toBe(6);
    });

    it("renders with custom count", () => {
      const { container } = render(<CardSkeleton count={3} />);
      const cards = container.querySelectorAll(".bg-slate-900\\/50");
      expect(cards.length).toBe(3);
    });

    it("has animation and grid layout", () => {
      const { container } = render(<CardSkeleton />);
      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
      expect(container.querySelector(".grid")).toBeInTheDocument();
    });
  });

  describe("StatsSkeleton", () => {
    it("renders exactly 4 stat cards", () => {
      const { container } = render(<StatsSkeleton />);
      const cards = container.querySelectorAll(".bg-slate-900\\/50");
      expect(cards.length).toBe(4);
    });

    it("has animation and grid layout", () => {
      const { container } = render(<StatsSkeleton />);
      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
      expect(container.querySelector(".grid")).toBeInTheDocument();
    });
  });
});
