import React from "react";
import { render } from "@testing-library/react";
import { Mail } from "lucide-react";
import { it, expect } from "vitest";

it("renders a mocked icon", () => {
  const { container } = render(<Mail className="test-class" />);
  expect(container.querySelector("svg")).toBeInTheDocument();
  expect(container.querySelector("svg")).toHaveClass("test-class");
});
