import { describe, test, expect, beforeEach } from "vitest";
import { buildFileManagerTool } from "@/lib/tools/file-manager";
import { VirtualFileSystem } from "@/lib/file-system";

describe("file_manager tool", () => {
  let fs: VirtualFileSystem;
  let execute: ReturnType<typeof buildFileManagerTool>["execute"];

  beforeEach(() => {
    fs = new VirtualFileSystem();
    fs.createFileWithParents("/App.jsx", "export default function App() {}");
    fs.createFileWithParents("/components/Button.jsx", "export default function Button() {}");
    const tool = buildFileManagerTool(fs);
    execute = tool.execute;
  });

  describe("rename command", () => {
    test("renames a file successfully", async () => {
      const result = await execute({
        command: "rename",
        path: "/App.jsx",
        new_path: "/App.tsx",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("renamed");
      expect(fs.exists("/App.tsx")).toBe(true);
      expect(fs.exists("/App.jsx")).toBe(false);
    });

    test("moves a file to a different directory", async () => {
      const result = await execute({
        command: "rename",
        path: "/App.jsx",
        new_path: "/src/App.jsx",
      });

      expect(result.success).toBe(true);
      expect(fs.exists("/src/App.jsx")).toBe(true);
      expect(fs.exists("/App.jsx")).toBe(false);
    });

    test("returns error when new_path is missing", async () => {
      const result = await execute({
        command: "rename",
        path: "/App.jsx",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("new_path is required");
    });

    test("returns error when source file does not exist", async () => {
      const result = await execute({
        command: "rename",
        path: "/nonexistent.jsx",
        new_path: "/other.jsx",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to rename");
    });
  });

  describe("delete command", () => {
    test("deletes a file successfully", async () => {
      const result = await execute({
        command: "delete",
        path: "/App.jsx",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("deleted");
      expect(fs.exists("/App.jsx")).toBe(false);
    });

    test("deletes a file in a subdirectory", async () => {
      const result = await execute({
        command: "delete",
        path: "/components/Button.jsx",
      });

      expect(result.success).toBe(true);
      expect(fs.exists("/components/Button.jsx")).toBe(false);
    });

    test("returns error when file does not exist", async () => {
      const result = await execute({
        command: "delete",
        path: "/nonexistent.jsx",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to delete");
    });
  });

  describe("invalid command", () => {
    test("returns error for unknown command", async () => {
      const result = await execute({
        command: "copy" as any,
        path: "/App.jsx",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid command");
    });
  });
});
