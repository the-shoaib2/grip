package tools

import (
	"context"
	"encoding/json"

	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/the-shoaib2/grip/packages/mcp-server/internal/cdp"
)

func RegisterResolveContextBlock(server *mcp.Server, _ *cdp.Session) {
	server.AddTool(&mcp.Tool{
		Name:        "resolve_context_block",
		Description: "Enrich a partial Context Block with workspace-relative path and source snippet (requires GRIP_WORKSPACE_ROOT).",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"componentName": map[string]interface{}{"type": "string"},
				"filePath":      map[string]interface{}{"type": "string"},
				"line":          map[string]interface{}{"type": "integer"},
				"framework":     map[string]interface{}{"type": "string"},
			},
			"required": []string{"componentName", "filePath", "line", "framework"},
		},
	}, func(_ context.Context, req *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		var in struct {
			ComponentName string `json:"componentName"`
			FilePath      string `json:"filePath"`
			Line          int    `json:"line"`
			Framework     string `json:"framework"`
		}
		if err := json.Unmarshal(req.Params.Arguments, &in); err != nil {
			return nil, err
		}
		root := workspaceRoot()
		rel, start, end, snippet, err := readSourceSnippet(in.FilePath, in.Line, root)
		if err != nil {
			return nil, err
		}
		return TextResult(map[string]interface{}{
			"componentName": in.ComponentName,
			"filePath":      rel,
			"lineRange":     map[string]int{"start": start, "end": end},
			"sourceCode":    snippet,
			"framework":     map[string]string{"name": in.Framework},
		})
	})
}
