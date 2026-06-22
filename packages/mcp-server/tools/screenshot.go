package tools

import (
	"context"
	"encoding/base64"
	"encoding/json"

	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/the-shoaib2/grip/packages/mcp-server/internal/cdp"
)

func RegisterScreenshot(server *mcp.Server, s *cdp.Session) {
	server.AddTool(&mcp.Tool{
		Name:        "screenshot",
		Description: "Capture a screenshot of the full page or a specific element.",
	}, func(_ context.Context, req *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		var in struct {
			Selector string `json:"selector"`
		}
		_ = json.Unmarshal(req.Params.Arguments, &in)
		buf, err := s.Screenshot(in.Selector)
		if err != nil {
			return nil, err
		}
		return TextResult(map[string]interface{}{
			"format": "png",
			"base64": base64.StdEncoding.EncodeToString(buf),
		})
	})
}
