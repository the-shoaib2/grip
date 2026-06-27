package tools

import (
	"context"
	"encoding/json"
	"sync"
	"time"

	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/the-shoaib2/grip/packages/mcp-server/internal/cdp"
)

type sessionContextRecord struct {
	SessionID    string                   `json:"sessionId"`
	Picks        []map[string]interface{} `json:"picks"`
	RegisteredAt int64                    `json:"registeredAt"`
}

var (
	sessionMu       sync.RWMutex
	sessionRegistry = map[string]sessionContextRecord{}
)

func StoreSessionContext(sessionID string, picks []map[string]interface{}) {
	record := sessionContextRecord{
		SessionID:    sessionID,
		Picks:        picks,
		RegisteredAt: time.Now().UnixMilli(),
	}
	sessionMu.Lock()
	sessionRegistry[sessionID] = record
	sessionMu.Unlock()
}

func RegisterRegisterSessionContext(server *mcp.Server, _ *cdp.Session) {
	server.AddTool(&mcp.Tool{
		Name:        "register_session_context",
		Description: "Register Grip session picks for agent handshake (in-memory for this MCP process).",
	}, func(_ context.Context, req *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		var in struct {
			SessionID string                   `json:"sessionId"`
			Picks     []map[string]interface{} `json:"picks"`
		}
		if err := json.Unmarshal(req.Params.Arguments, &in); err != nil {
			return nil, err
		}
		
		StoreSessionContext(in.SessionID, in.Picks)
		
		return TextResult(map[string]interface{}{
			"ok":        true,
			"sessionId": in.SessionID,
			"pickCount": len(in.Picks),
		})
	})
}

func RegisterGetSessionContext(server *mcp.Server, _ *cdp.Session) {
	server.AddTool(&mcp.Tool{
		Name:        "get_session_context",
		Description: "Retrieve registered Grip session picks by sessionId.",
	}, func(_ context.Context, req *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		var in struct {
			SessionID string `json:"sessionId"`
		}
		if err := json.Unmarshal(req.Params.Arguments, &in); err != nil {
			return nil, err
		}
		sessionMu.RLock()
		record, ok := sessionRegistry[in.SessionID]
		sessionMu.RUnlock()
		if !ok {
			return TextResult(map[string]interface{}{
				"ok":    false,
				"error": "session not found",
			})
		}
		return TextResult(map[string]interface{}{
			"ok":           true,
			"sessionId":    record.SessionID,
			"picks":        record.Picks,
			"registeredAt": record.RegisteredAt,
		})
	})
}
