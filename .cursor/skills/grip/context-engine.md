# Grip Context Engine

Transform visual element selections into precise source-code editing tasks. Operate only on supplied Context Blocks — never search the codebase when context is provided.

## When to use

- User pastes a `CONTEXT:` block from Grip Copy / Send to agent
- User asks to edit a picked UI element's source code
- `resolve_context_block` or `get_session_context` returns structured context

## Context Block format

```
CONTEXT:
Component: <name>
File: <path>
Lines: <start>-<end>

<source code>

INSTRUCTIONS:
* <instruction>
```

## Rules

1. Trust the supplied source code, file path, and line range as source of truth
2. Treat each `CONTEXT:` section independently
3. Execute multiple instructions in order within one block
4. Return structured patches per block (see below)
5. Never edit outside the supplied line range
6. Never modify secrets, env files, CI, or package manager files

## Response format (per block)

```
Status: SUCCESS | FAILED

Context: <Component Name>

File: <File Path>

Changes:
- <change 1>

Patch: { startLine: N, endLine: N, replacementCode: <code> }

Summary: <short explanation>
```

## Context Badges (rich editor)

The inline context composer uses **Context Badges** — not a plain textarea.

- **Create:** pick an element → badge inserts at cursor
- **Read:** hover for component, file, lines, framework, parents/children, timestamps, ID
- **Update:** right-click → Replace / Refresh Context
- **Delete:** Backspace/Delete or Remove — instructions stay intact
- **Cut/Copy/Paste:** Ctrl+X/C/V — badges copy as JSON; `[[grip:id]]` tokens paste with registry metadata
- **Drag:** reorder badges in the editor
- **Multi-select:** Ctrl/Cmd+click, Shift+click range
- **Group:** right-click → Group Selected
- **States:** ready ✓, outdated ↻, missing ?, processing …, failed !

## MCP tools

| Tool | Purpose |
|------|---------|
| `resolve_context_block` | Attach source snippet from disk (`GRIP_WORKSPACE_ROOT`) |
| `apply_context_patch` | Apply line-range patch after validation |
| `register_session_context` | Register session picks from `GRIP_SESSION_JSON` footer |
| `get_session_context` | Retrieve registered session by `sessionId` |

## Workflow

1. User picks element(s) in Grip extension and adds instructions
2. Copy Context Block or Send to agent (includes session JSON)
3. If source is missing, call `resolve_context_block`
4. Generate patch scoped to supplied source only
5. Apply via `apply_context_patch` or return patch for user review

## Dual-mode copy

- **Context Block** — when framework source metadata is available (React dev builds)
- **DOM prompt** — fallback for browser automation via `snapshot` / `click`
