package tools

import (
	"context"

	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/the-shoaib2/grip/packages/mcp-server/internal/cdp"
)

func RegisterPickElement(server *mcp.Server, s *cdp.Session) {
	server.AddTool(&mcp.Tool{
		Name:        "pick_element",
		Description: "Activate visual element picker. User clicks an element; returns metadata.",
		InputSchema: map[string]interface{}{
			"type": "object",
		},
	}, func(ctx context.Context, _ *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		picked, err := s.PickElement(ctx)
		if err != nil {
			return nil, err
		}
		return TextResult(picked)
	})
}
