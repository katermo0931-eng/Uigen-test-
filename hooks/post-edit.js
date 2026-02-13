/**
 * Post-tool hook: Runs Next.js ESLint on edited TypeScript/JavaScript files.
 *
 * Receives tool call data as JSON via stdin.
 * Lint errors are sent to stderr so Claude can see and fix them.
 *
 * Uses `next lint` because this project uses .eslintrc.json with "extends": "next".
 */

const { execSync } = require("child_process");
const path = require("path");

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    const filePath = data.tool_input?.file_path || "";

    if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) {
      process.exit(0);
    }

    // Get the directory containing the edited file for targeted linting
    const dir = path.dirname(filePath) || "src";

    try {
      execSync(`npx next lint --dir "${dir}" --quiet`, {
        stdio: "pipe",
        timeout: 30000,
      });
    } catch (e) {
      const output = e.stdout?.toString() || e.stderr?.toString() || "";
      if (output.trim()) {
        console.error(`ESLint issues after editing ${filePath}:\n${output}`);
      }
    }
  } catch {
    // If we can't parse input, skip silently
  }

  process.exit(0);
});
