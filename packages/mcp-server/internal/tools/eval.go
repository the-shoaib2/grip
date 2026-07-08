package tools

import (
	"context"
	"encoding/json"

	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/the-shoaib2/grip/packages/mcp-server/internal/cdp"
)

func RegisterEval(server *mcp.Server, s *cdp.Session) {
	server.AddTool(&mcp.Tool{
		Name:        "eval",
		Description: "Runtime.evaluate in page context.",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"js": map[string]interface{}{
					"type": "string",
				},
			},
			"required": []string{"js"},
		},
	}, func(_ context.Context, req *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		var in struct {
			JS string `json:"js"`
		}
		if err := json.Unmarshal(req.Params.Arguments, &in); err != nil {
			return nil, err
		}
		result, err := s.Eval(in.JS)
		if err != nil {
			return nil, err
		}
		return TextResult(map[string]interface{}{"result": result})
	})
}
