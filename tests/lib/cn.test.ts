import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils/cn";

describe("cn utility function", () => {
  it("merges class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", true && "active", false && "hidden")).toBe("base active");
  });

  it("handles undefined and null values", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("handles arrays of classes", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });

  it("handles objects for conditional classes", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });

  it("deduplicates Tailwind classes", () => {
    // tailwind-merge should resolve conflicting classes
    expect(cn("p-4", "p-6")).toBe("p-6");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles complex responsive classes", () => {
    expect(cn("sm:p-4", "sm:p-6")).toBe("sm:p-6");
    expect(cn("md:text-lg", "md:text-xl")).toBe("md:text-xl");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
  });
});
