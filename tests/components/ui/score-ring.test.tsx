import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreRingStatic } from "@/components/ui/score-ring";

// Note: We test ScoreRingStatic because ScoreRing uses Framer Motion animations
// that require more complex setup. The static version is used for SSR and lists.

describe("ScoreRingStatic component", () => {
  it("renders with default props", () => {
    render(<ScoreRingStatic score={75} />);
    expect(screen.getByText("75")).toBeInTheDocument();
  });

  it("renders the correct score", () => {
    render(<ScoreRingStatic score={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("hides label when showLabel is false", () => {
    render(<ScoreRingStatic score={85} showLabel={false} />);
    expect(screen.queryByText("85")).not.toBeInTheDocument();
  });

  it("has correct aria-label for accessibility", () => {
    render(<ScoreRingStatic score={90} />);
    const svg = document.querySelector("svg");
    expect(svg).toHaveAttribute("aria-label", "Score: 90 out of 100");
  });

  it("renders with xs size", () => {
    const { container } = render(<ScoreRingStatic score={50} size="xs" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: "24px", height: "24px" });
  });

  it("renders with sm size", () => {
    const { container } = render(<ScoreRingStatic score={50} size="sm" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: "32px", height: "32px" });
  });

  it("renders with md size (default)", () => {
    const { container } = render(<ScoreRingStatic score={50} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: "48px", height: "48px" });
  });

  it("renders with lg size", () => {
    const { container } = render(<ScoreRingStatic score={50} size="lg" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: "80px", height: "80px" });
  });

  it("renders with xl size", () => {
    const { container } = render(<ScoreRingStatic score={50} size="xl" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: "120px", height: "120px" });
  });

  it("applies jade color for excellent scores (85+)", () => {
    render(<ScoreRingStatic score={90} />);
    const label = screen.getByText("90");
    expect(label).toHaveStyle({ color: "var(--color-jade)" });
  });

  it("applies iris color for good scores (70-84)", () => {
    render(<ScoreRingStatic score={75} />);
    const label = screen.getByText("75");
    expect(label).toHaveStyle({ color: "var(--color-iris)" });
  });

  it("applies amber color for fair scores (50-69)", () => {
    render(<ScoreRingStatic score={55} />);
    const label = screen.getByText("55");
    expect(label).toHaveStyle({ color: "var(--color-amber)" });
  });

  it("applies coral color for poor scores (<50)", () => {
    render(<ScoreRingStatic score={35} />);
    const label = screen.getByText("35");
    expect(label).toHaveStyle({ color: "var(--color-coral)" });
  });

  it("accepts custom className", () => {
    const { container } = render(
      <ScoreRingStatic score={50} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders SVG with correct structure", () => {
    render(<ScoreRingStatic score={50} />);
    const svg = document.querySelector("svg");
    const circles = document.querySelectorAll("circle");

    expect(svg).toBeInTheDocument();
    expect(circles).toHaveLength(2); // Background track + progress ring
  });

  it("handles edge case score of 0", () => {
    render(<ScoreRingStatic score={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    const label = screen.getByText("0");
    expect(label).toHaveStyle({ color: "var(--color-coral)" });
  });

  it("handles edge case score of 100", () => {
    render(<ScoreRingStatic score={100} />);
    expect(screen.getByText("100")).toBeInTheDocument();
    const label = screen.getByText("100");
    expect(label).toHaveStyle({ color: "var(--color-jade)" });
  });

  it("handles boundary score of 85 (exactly excellent)", () => {
    render(<ScoreRingStatic score={85} />);
    const label = screen.getByText("85");
    expect(label).toHaveStyle({ color: "var(--color-jade)" });
  });

  it("handles boundary score of 70 (exactly good)", () => {
    render(<ScoreRingStatic score={70} />);
    const label = screen.getByText("70");
    expect(label).toHaveStyle({ color: "var(--color-iris)" });
  });

  it("handles boundary score of 50 (exactly fair)", () => {
    render(<ScoreRingStatic score={50} />);
    const label = screen.getByText("50");
    expect(label).toHaveStyle({ color: "var(--color-amber)" });
  });
});
