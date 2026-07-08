package tools

import (
	"context"
	"encoding/json"

	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/the-shoaib2/grip/packages/mcp-server/internal/cdp"
)

func RegisterApplyContextPatch(server *mcp.Server, _ *cdp.Session) {
	server.AddTool(&mcp.Tool{
		Name:        "apply_context_patch",
		Description: "Apply a line-range Context Engine patch to a source file (requires GRIP_WORKSPACE_ROOT).",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"file":            map[string]interface{}{"type": "string"},
				"startLine":       map[string]interface{}{"type": "integer"},
				"endLine":         map[string]interface{}{"type": "integer"},
				"replacementCode": map[string]interface{}{"type": "string"},
				"context":         map[string]interface{}{"type": "string"},
				"summary":         map[string]interface{}{"type": "string"},
			},
			"required": []string{"file", "startLine", "endLine", "replacementCode"},
		},
	}, func(_ context.Context, req *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		var in struct {
			File              string `json:"file"`
			StartLine         int    `json:"startLine"`
			EndLine           int    `json:"endLine"`
			ReplacementCode   string `json:"replacementCode"`
			Context           string `json:"context"`
			Summary           string `json:"summary"`
		}
		if err := json.Unmarshal(req.Params.Arguments, &in); err != nil {
			return nil, err
		}
		if isBlockedPatchPath(in.File) {
			return TextResult(map[string]interface{}{
				"ok":     false,
				"errors": []string{"blocked file path"},
			})
		}
		root := workspaceRoot()
		if err := applyLinePatch(in.File, in.StartLine, in.EndLine, in.ReplacementCode, root); err != nil {
			return TextResult(map[string]interface{}{
				"ok":     false,
				"errors": []string{err.Error()},
			})
		}
		return TextResult(map[string]interface{}{
			"ok":        true,
			"file":      normalizeSourcePath(in.File, root),
			"startLine": in.StartLine,
			"endLine":   in.EndLine,
			"summary":   in.Summary,
			"context":   in.Context,
		})
	})
}
