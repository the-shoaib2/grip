package tools

import (
	"encoding/json"

	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/the-shoaib2/grip/packages/mcp-server/internal/cdp"
)

func TextResult(v interface{}) (*mcp.CallToolResult, error) {
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return nil, err
	}
	return &mcp.CallToolResult{
		Content: []mcp.Content{&mcp.TextContent{Text: string(b)}},
	}, nil
}

func Register(server *mcp.Server, s *cdp.Session) {
	RegisterSnapshot(server, s)
	RegisterHighlight(server, s)
	RegisterClick(server, s)
	RegisterFill(server, s)
	RegisterReadLogs(server, s)
	RegisterReadNetwork(server, s)
	RegisterScreenshot(server, s)
	RegisterPickElement(server, s)
	RegisterNavigate(server, s)
	RegisterEval(server, s)
}
