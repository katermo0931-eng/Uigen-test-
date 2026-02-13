import { test, expect } from "vitest";
import { cn } from "@/lib/utils";

test("merges class names", () => {
  expect(cn("px-2", "py-1")).toBe("px-2 py-1");
});

test("handles conditional classes", () => {
  expect(cn("base", false && "hidden", "extra")).toBe("base extra");
});

test("merges conflicting Tailwind classes (last wins)", () => {
  expect(cn("px-2", "px-4")).toBe("px-4");
});

test("handles undefined and null inputs", () => {
  expect(cn("a", undefined, null, "b")).toBe("a b");
});

test("handles empty input", () => {
  expect(cn()).toBe("");
});

test("handles array inputs via clsx", () => {
  expect(cn(["a", "b"], "c")).toBe("a b c");
});
