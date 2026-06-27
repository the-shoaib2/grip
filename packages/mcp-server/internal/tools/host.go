package tools

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"
)

func workspaceRoot() string {
	if root := strings.TrimSpace(os.Getenv("GRIP_WORKSPACE_ROOT")); root != "" {
		return root
	}
	if root := strings.TrimSpace(os.Getenv("CURSOR_WORKSPACE_ROOT")); root != "" {
		return root
	}
	if cwd, err := os.Getwd(); err == nil {
		return cwd
	}
	return ""
}

func normalizeSourcePath(filePath, root string) string {
	normalized := filepath.ToSlash(filePath)
	if root == "" {
		return normalized
	}
	rootSlash := strings.TrimSuffix(filepath.ToSlash(root), "/")
	if strings.HasPrefix(normalized, rootSlash+"/") {
		return strings.TrimPrefix(normalized, rootSlash+"/")
	}
  for _, marker := range []string{"/apps/", "/packages/", "/src/"} {
		if idx := strings.Index(normalized, marker); idx >= 0 {
			return strings.TrimPrefix(normalized[idx:], "/")
		}
	}
	return normalized
}

func resolveSourcePath(filePath, root string) string {
	normalized := filepath.ToSlash(filePath)
	if root == "" || strings.HasPrefix(normalized, "/") {
		return normalized
	}
	return filepath.Join(root, normalized)
}

func readSourceSnippet(filePath string, line int, root string) (relative string, start int, end int, snippet string, err error) {
	relative = normalizeSourcePath(filePath, root)
	absolute := resolveSourcePath(relative, root)
	content, err := os.ReadFile(absolute)
	if err != nil {
		return "", 0, 0, "", err
	}
	lines := strings.Split(strings.ReplaceAll(string(content), "\r\n", "\n"), "\n")
	if line < 1 {
		line = 1
	}
	start, end = expandLineRange(lines, line, 2, 80)
	snippet = strings.Join(lines[start-1:end], "\n")
	return relative, start, end, snippet, nil
}

func expandLineRange(lines []string, anchorLine, padding, maxLines int) (int, int) {
	lineIdx := anchorLine - 1
	if lineIdx < 0 {
		lineIdx = 0
	}
	if lineIdx >= len(lines) {
		lineIdx = len(lines) - 1
	}
	start := lineIdx
	end := lineIdx
	for start > 0 && !isBoundary(lines[start]) {
		start--
		if lineIdx-start > 40 {
			break
		}
	}
	for end < len(lines)-1 {
		next := lines[end+1]
		if isBoundary(next) && end > lineIdx {
			break
		}
		end++
		if end-lineIdx > 40 {
			break
		}
	}
	start -= padding
	if start < 0 {
		start = 0
	}
	end += padding
	if end >= len(lines) {
		end = len(lines) - 1
	}
	if end-start+1 > maxLines {
		half := maxLines / 2
		start = lineIdx - half
		if start < 0 {
			start = 0
		}
		end = start + maxLines - 1
		if end >= len(lines) {
			end = len(lines) - 1
		}
	}
	return start + 1, end + 1
}

func isBoundary(line string) bool {
	trimmed := strings.TrimSpace(line)
	if trimmed == "" {
		return false
	}
	return strings.HasPrefix(trimmed, "export ") ||
		strings.HasPrefix(trimmed, "function ") ||
		strings.HasPrefix(trimmed, "class ") ||
		strings.HasPrefix(trimmed, "const ") ||
		strings.HasPrefix(trimmed, "let ") ||
		strings.HasPrefix(trimmed, "var ")
}

func applyLinePatch(filePath string, startLine, endLine int, replacement string, root string) error {
	relative := normalizeSourcePath(filePath, root)
	absolute := resolveSourcePath(relative, root)
	file, err := os.Open(absolute)
	if err != nil {
		return err
	}
	var lines []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	file.Close()
	if err := scanner.Err(); err != nil {
		return err
	}
	if startLine < 1 || endLine < startLine || endLine > len(lines) {
		return os.ErrInvalid
	}
	replacementLines := strings.Split(strings.ReplaceAll(replacement, "\r\n", "\n"), "\n")
	var out []string
	out = append(out, lines[:startLine-1]...)
	out = append(out, replacementLines...)
	out = append(out, lines[endLine:]...)
	return os.WriteFile(absolute, []byte(strings.Join(out, "\n")), 0o644)
}

func isBlockedPatchPath(filePath string) bool {
	normalized := strings.ToLower(filepath.ToSlash(filePath))
	blocked := []string{"/.env", "/.git/", "/node_modules/", "/.github/workflows/"}
	for _, part := range blocked {
		if strings.Contains(normalized, part) {
			return true
		}
	}
	base := filepath.Base(normalized)
	return strings.HasPrefix(base, ".env")
}
