package tools

import (
	"context"
	"encoding/json"

	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/the-shoaib2/grip/packages/mcp-server/internal/cdp"
)

func RegisterHighlight(server *mcp.Server, s *cdp.Session) {
	server.AddTool(&mcp.Tool{
		Name:        "highlight",
		Description: "Draw a visible blue overlay on the element for confirmation.",
	}, func(_ context.Context, req *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		var in struct {
			Ref string `json:"ref"`
		}
		if err := json.Unmarshal(req.Params.Arguments, &in); err != nil {
			return nil, err
		}
		if err := s.Highlight(in.Ref); err != nil {
			return nil, err
		}
		return TextResult(map[string]interface{}{"success": true, "ref": in.Ref})
	})
}
