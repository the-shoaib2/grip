package tools

import (
	"context"
	"encoding/json"

	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/the-shoaib2/grip/packages/mcp-server/internal/cdp"
)

func RegisterSnapshot(server *mcp.Server, s *cdp.Session) {
	server.AddTool(&mcp.Tool{
		Name:        "snapshot",
		Description: "Get the full accessibility tree + ref map of the current page.",
	}, func(_ context.Context, req *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		var in struct {
			FrameID string `json:"frameId"`
		}
		_ = json.Unmarshal(req.Params.Arguments, &in)
		yaml, title, url, err := s.Snapshot(in.FrameID)
		if err != nil {
			return nil, err
		}
		return TextResult(map[string]interface{}{
			"yaml": yaml, "refs": s.AllRefs(), "title": title, "url": url,
		})
	})
}
