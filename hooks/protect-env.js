/**
 * Pre-tool hook: Blocks Claude from reading .env files.
 *
 * Receives tool call data as JSON via stdin.
 * Exit code 0 = allow, exit code 2 = block.
 * Messages on stderr are sent back to Claude as feedback.
 */

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    const filePath =
      data.tool_input?.file_path ||
      data.tool_input?.path ||
      data.tool_input?.pattern ||
      "";

    if (filePath.includes(".env")) {
      console.error(
        "BLOCKED: Cannot read .env files — they may contain secrets (API keys, database credentials). " +
          "If you need environment variable names, check .env.example instead."
      );
      process.exit(2);
    }
  } catch {
    // If we can't parse input, allow the operation
  }

  process.exit(0);
});
