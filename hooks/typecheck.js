/**
 * Post-tool hook: Runs TypeScript type checker after .ts/.tsx file edits.
 *
 * Catches type errors immediately so Claude can fix call sites
 * when function signatures change.
 * Errors are sent to stderr so Claude receives them as feedback.
 */

const { execSync } = require("child_process");

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    const filePath = data.tool_input?.file_path || "";

    if (!/\.tsx?$/.test(filePath)) {
      process.exit(0);
    }

    try {
      execSync("npx tsc --noEmit", {
        stdio: "pipe",
        timeout: 60000,
      });
    } catch (e) {
      const output = e.stdout?.toString() || e.stderr?.toString() || "";
      if (output.trim()) {
        console.error(`TypeScript errors found after editing ${filePath}:\n${output}`);
      }
    }
  } catch {
    // If we can't parse input, skip silently
  }

  process.exit(0);
});
