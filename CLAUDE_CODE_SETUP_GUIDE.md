# Claude Code Setup Guide for UIGen

## 1. Initial Setup

### First Run
```bash
# Initialize Claude Code in the project — generates CLAUDE.md with project context
/init
```

### CLAUDE.md Files (Context for Every Request)
There are three levels of CLAUDE.md:

| Level | Location | Shared? | Purpose |
|-------|----------|---------|---------|
| **Project** | `./CLAUDE.md` | Yes (committed) | Team-wide instructions, architecture, commands |
| **Local** | `.claude/CLAUDE.local.md` | No (gitignored) | Personal preferences, local paths |
| **Machine** | `~/.claude/CLAUDE.md` | No | Global instructions for all projects |

Edit them with the **memory shortcut** — type `#` followed by a natural language instruction:
```
# Always run tests after editing TypeScript files
# Use Vitest, not Jest
# The database schema in prisma/schema.prisma is critical context
```

### Provide Targeted Context with `@`
Reference specific files in your prompts instead of letting Claude search:
```
@src/lib/file-system.ts add a method to copy files
@prisma/schema.prisma add a Settings model
```

---

## 2. Modes & Shortcuts

| Action | Shortcut | When to Use |
|--------|----------|-------------|
| **Plan Mode** | `Shift+Tab` twice | Multi-step tasks needing broad codebase understanding |
| **Think Mode** | Say "think hard" or "ultra think" | Complex logic, tricky debugging |
| **Paste Screenshot** | `Ctrl+V` | Show Claude a UI element to modify |
| **Stop Response** | `Escape` | Redirect Claude mid-response |
| **Rewind** | `Escape` twice | Jump back to an earlier point in conversation |
| **Compact** | `/compact` | Summarize long conversation, keep learned context |
| **Clear** | `/clear` | Fresh start for unrelated tasks |

---

## 3. Custom Slash Commands

Create reusable commands in `.claude/commands/`:

```bash
mkdir -p .claude/commands
```

**Example: `/test-file` command**

File: `.claude/commands/test-file.md`
```markdown
Run the tests for the file at $ARGUMENTS and fix any failures.
Use `npx vitest run` to run individual test files.
```

Usage: `/test-file src/lib/__tests__/file-system.test.ts`

**Example: `/audit` command**

File: `.claude/commands/audit.md`
```markdown
Audit the file at $ARGUMENTS for:
- Security vulnerabilities (XSS, injection, etc.)
- Performance issues
- Missing error handling
Provide a summary of findings.
```

---

## 4. Hooks

Hooks run custom commands before/after Claude uses tools. Configure in `.claude/settings.local.json`.

### Hook Types

| Hook | Timing | Can Block? | Use Case |
|------|--------|------------|----------|
| **PreToolUse** | Before tool runs | Yes (exit code 2) | Block sensitive file access, validate operations |
| **PostToolUse** | After tool runs | No | Auto-lint, run type checks, run tests |

### Configuration File

File: `.claude/settings.local.json`
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "read|grep",
        "command": "node ./hooks/protect-env.js"
      }
    ],
    "PostToolUse": [
      {
        "matcher": "edit|write",
        "command": "node ./hooks/post-edit.js"
      }
    ]
  }
}
```

### Pre-Tool Hook: Protect .env Files

File: `hooks/protect-env.js`
```javascript
// Receives tool call data as JSON via stdin
let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const data = JSON.parse(input);
  const filePath = data.tool_input?.file_path || data.tool_input?.path || "";

  if (filePath.includes(".env")) {
    console.error("BLOCKED: Cannot read .env files — contains secrets.");
    process.exit(2); // Exit code 2 = block the tool call
  }

  process.exit(0); // Exit code 0 = allow
});
```

### Post-Tool Hook: Auto-Lint After Edits

File: `hooks/post-edit.js`
```javascript
const { execSync } = require("child_process");

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const data = JSON.parse(input);
  const filePath = data.tool_input?.file_path || "";

  // Only lint TypeScript/JavaScript files
  if (/\.(ts|tsx|js|jsx)$/.test(filePath)) {
    try {
      execSync(`npx eslint --fix "${filePath}"`, { stdio: "pipe" });
    } catch (e) {
      // Send lint errors back to Claude via stderr
      console.error(`Lint errors in ${filePath}:\n${e.stdout?.toString()}`);
    }
  }

  process.exit(0);
});
```

### Post-Tool Hook: TypeScript Type Checker

File: `hooks/typecheck.js`
```javascript
const { execSync } = require("child_process");

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const data = JSON.parse(input);
  const filePath = data.tool_input?.file_path || "";

  if (/\.tsx?$/.test(filePath)) {
    try {
      execSync("npx tsc --noEmit", { stdio: "pipe" });
    } catch (e) {
      console.error(`Type errors found:\n${e.stdout?.toString()}`);
    }
  }

  process.exit(0);
});
```

To enable, add to `.claude/settings.local.json`:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "edit|write",
        "command": "node ./hooks/typecheck.js"
      }
    ]
  }
}
```

**Important**: Restart Claude Code after changing hook configuration.

---

## 5. MCP Servers (Extending Capabilities)

MCP servers add external tools (browser automation, APIs, etc.).

### Add an MCP Server
```bash
# Example: add Playwright for browser automation
claude mcp add playwright npx @anthropic/mcp-playwright

# Auto-approve its tools in .claude/settings.local.json:
# Add "MCP__playwright" to the allow array
```

### UIGen-Specific Use Case
Use Playwright MCP to have Claude:
1. Start the dev server
2. Open the app in a browser
3. Generate a component via the chat
4. Take a screenshot of the preview
5. Iterate on styling based on visual feedback

---

## 6. GitHub Integration

### Install
```
/install-github-app
```
This adds two GitHub Actions workflows:
1. **@claude mentions** — tag `@claude` in issues/PRs to assign tasks
2. **PR review** — automatic code review on new pull requests

### Customize Workflows
Edit files in `.github/workflows/` to:
- Add custom instructions
- Integrate MCP servers
- Define permission lists for Claude

---

## 7. Claude Code SDK (Programmatic Use)

Use Claude Code in scripts, pipelines, and hooks:

### TypeScript
```typescript
import { query } from "@anthropic-ai/claude-code";

const result = await query("Fix the type errors in src/lib/auth.ts", {
  allowedTools: ["read", "edit", "grep"],
});
```

### CLI
```bash
claude -p "Run the tests and summarize results"
```

**Default permissions**: Read-only. Add write tools explicitly via `allowedTools`.

---

## 8. Recommended Setup for This Project

### Minimum Setup
1. The `CLAUDE.md` already exists with architecture + commands
2. Run `npm run setup` before first use

### Recommended Additions
```bash
mkdir -p .claude/commands hooks
```

Create `.claude/settings.local.json` with:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "read|grep",
        "command": "node ./hooks/protect-env.js"
      }
    ],
    "PostToolUse": [
      {
        "matcher": "edit|write",
        "command": "node ./hooks/post-edit.js"
      }
    ]
  }
}
```

Add to `.claude/CLAUDE.local.md`:
```markdown
# Local Dev Notes
- Always run `npm test` after modifying source files
- The Prisma schema at prisma/schema.prisma is critical context
- Use Vitest (not Jest) for all tests
```

### Quick Reference

| Task | Command |
|------|---------|
| Add context permanently | `# <instruction>` (memory mode) |
| Add context for one prompt | `@path/to/file` |
| Plan complex changes | Shift+Tab twice, then describe task |
| Debug tricky logic | "Think hard about..." or "Ultra think" |
| Create reusable command | Add `.claude/commands/<name>.md` |
| Add pre/post hooks | Edit `.claude/settings.local.json` |
| Extend with MCP | `claude mcp add <name> <command>` |
| Integrate with GitHub | `/install-github-app` |
