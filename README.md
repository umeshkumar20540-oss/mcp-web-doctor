# 🩺 mcp-web-doctor

**Give your AI coding agent (Cursor, Claude Code, Antigravity, Codex) a real-time Web Vitals, SEO, CSS, and Accessibility doctor.**

Zero external dependencies. Audits local HTML files or live URLs in milliseconds and returns structured, patch-ready diagnostics.

## Quickstart
```bash
npx mcp-web-doctor audit https://example.com
```

## MCP Configuration
```json
{
  "mcpServers": {
    "web-doctor": {
      "command": "npx",
      "args": ["mcp-web-doctor", "mcp"]
    }
  }
}
```

## License
MIT — More free web-perf & SEO tools at [minimaxtools.com](https://minimaxtools.com).
