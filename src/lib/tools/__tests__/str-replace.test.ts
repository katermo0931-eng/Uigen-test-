import { describe, test, expect, beforeEach } from "vitest";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";
import { VirtualFileSystem } from "@/lib/file-system";

describe("str_replace_editor tool", () => {
  let fs: VirtualFileSystem;
  let tool: ReturnType<typeof buildStrReplaceTool>;

  beforeEach(() => {
    fs = new VirtualFileSystem();
    tool = buildStrReplaceTool(fs);
  });

  test("has correct id and parameters", () => {
    expect(tool.id).toBe("str_replace_editor");
    expect(tool.parameters).toBeDefined();
  });

  describe("create command", () => {
    test("creates a new file with content", async () => {
      const result = await tool.execute({
        command: "create",
        path: "/App.jsx",
        file_text: "export default function App() { return <div>Hello</div>; }",
      });

      expect(result).toContain("created");
      expect(fs.exists("/App.jsx")).toBe(true);
      expect(fs.getNode("/App.jsx")?.content).toBe(
        "export default function App() { return <div>Hello</div>; }"
      );
    });

    test("creates a file with parent directories", async () => {
      const result = await tool.execute({
        command: "create",
        path: "/components/Button.jsx",
        file_text: "export default function Button() {}",
      });

      expect(result).toContain("created");
      expect(fs.exists("/components/Button.jsx")).toBe(true);
    });

    test("creates an empty file when no file_text provided", async () => {
      await tool.execute({
        command: "create",
        path: "/empty.txt",
      });

      expect(fs.exists("/empty.txt")).toBe(true);
      expect(fs.getNode("/empty.txt")?.content).toBe("");
    });
  });

  describe("view command", () => {
    test("views file content", async () => {
      fs.createFileWithParents("/test.txt", "line1\nline2\nline3");
      const result = await tool.execute({
        command: "view",
        path: "/test.txt",
      });

      expect(result).toContain("line1");
      expect(result).toContain("line2");
      expect(result).toContain("line3");
    });

    test("views file with range", async () => {
      fs.createFileWithParents("/test.txt", "line1\nline2\nline3\nline4\nline5");
      const result = await tool.execute({
        command: "view",
        path: "/test.txt",
        view_range: [2, 4],
      });

      expect(result).toContain("line2");
      expect(result).toContain("line4");
    });
  });

  describe("str_replace command", () => {
    test("replaces text in a file", async () => {
      fs.createFileWithParents("/app.js", 'const greeting = "hello";');
      const result = await tool.execute({
        command: "str_replace",
        path: "/app.js",
        old_str: '"hello"',
        new_str: '"world"',
      });

      expect(fs.getNode("/app.js")?.content).toBe('const greeting = "world";');
    });
  });

  describe("insert command", () => {
    test("inserts text at a specific line", async () => {
      fs.createFileWithParents("/app.js", "line1\nline2\nline3");
      await tool.execute({
        command: "insert",
        path: "/app.js",
        insert_line: 2,
        new_str: "inserted",
      });

      const content = fs.getNode("/app.js")?.content;
      expect(content).toContain("inserted");
    });
  });

  describe("undo_edit command", () => {
    test("returns an error message", async () => {
      const result = await tool.execute({
        command: "undo_edit",
        path: "/app.js",
      });

      expect(result).toContain("not supported");
    });
  });
});
