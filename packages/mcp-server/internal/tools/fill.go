package tools

import (
	"context"
	"encoding/json"

	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/the-shoaib2/grip/packages/mcp-server/internal/cdp"
)

func RegisterFill(server *mcp.Server, s *cdp.Session) {
	server.AddTool(&mcp.Tool{
		Name:        "fill",
		Description: "Type into an input or textarea.",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"ref": map[string]interface{}{
					"type": "string",
				},
				"value": map[string]interface{}{
					"type": "string",
				},
			},
			"required": []string{"ref", "value"},
		},
	}, func(_ context.Context, req *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		var in struct {
			Ref   string `json:"ref"`
			Value string `json:"value"`
		}
		if err := json.Unmarshal(req.Params.Arguments, &in); err != nil {
			return nil, err
		}
		if err := s.Fill(in.Ref, in.Value); err != nil {
			return nil, err
		}
		return TextResult(map[string]interface{}{"success": true, "ref": in.Ref, "value": in.Value})
	})
}
