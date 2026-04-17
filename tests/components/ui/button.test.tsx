import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

describe("Button component", () => {
  it("renders with default props", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("renders with primary variant by default", () => {
    render(<Button>Primary</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-iris");
  });

  it("renders with secondary variant", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-surface-03");
  });

  it("renders with ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-transparent");
  });

  it("renders with danger variant", () => {
    render(<Button variant="danger">Danger</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-coral-dim");
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("disables button when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows loading state", () => {
    render(<Button isLoading>Loading</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    // Should show loader icon (Loader2 component)
    expect(button.querySelector("svg")).toBeTruthy();
  });

  it("does not trigger click when loading", () => {
    const handleClick = vi.fn();
    render(
      <Button isLoading onClick={handleClick}>
        Loading
      </Button>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders with left icon", () => {
    render(<Button leftIcon={<Search data-testid="left-icon" />}>Search</Button>);
    expect(screen.getByTestId("left-icon")).toBeInTheDocument();
  });

  it("renders with right icon", () => {
    render(<Button rightIcon={<Search data-testid="right-icon" />}>Search</Button>);
    expect(screen.getByTestId("right-icon")).toBeInTheDocument();
  });

  it("hides left icon when loading", () => {
    render(
      <Button isLoading leftIcon={<Search data-testid="left-icon" />}>
        Search
      </Button>
    );
    expect(screen.queryByTestId("left-icon")).not.toBeInTheDocument();
  });

  it("renders different sizes", () => {
    const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
    const sizeClasses = {
      xs: "px-2.5",
      sm: "px-3",
      md: "px-3.5",
      lg: "px-5",
      xl: "px-6",
    };

    sizes.forEach((size) => {
      const { unmount } = render(<Button size={size}>{size}</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass(sizeClasses[size]);
      unmount();
    });
  });

  it("accepts custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });
});
