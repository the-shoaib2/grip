package tools

import (
	"context"
	"encoding/json"

	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/the-shoaib2/grip/packages/mcp-server/internal/cdp"
)

func RegisterReadNetwork(server *mcp.Server, s *cdp.Session) {
	server.AddTool(&mcp.Tool{
		Name:        "read_network",
		Description: "Returns recent network requests as HAR entries.",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"filter": map[string]interface{}{
					"type": "object",
					"properties": map[string]interface{}{
						"url":    map[string]interface{}{"type": "string"},
						"method": map[string]interface{}{"type": "string"},
						"status": map[string]interface{}{"type": "integer"},
					},
				},
			},
		},
	}, func(_ context.Context, req *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		var in struct {
			Filter *struct {
				URL    string `json:"url"`
				Method string `json:"method"`
				Status int64  `json:"status"`
			} `json:"filter"`
		}
		_ = json.Unmarshal(req.Params.Arguments, &in)
		url, method, status := "", "", int64(0)
		if in.Filter != nil {
			url, method, status = in.Filter.URL, in.Filter.Method, in.Filter.Status
		}
		return TextResult(s.ReadNetwork(url, method, status))
	})
}
