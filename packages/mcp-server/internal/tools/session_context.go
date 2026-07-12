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
	now := time.Now().UnixMilli()
	record := sessionContextRecord{
		SessionID:    sessionID,
		Picks:        picks,
		RegisteredAt: now,
	}
	sessionMu.Lock()
	sessionRegistry[sessionID] = record

	// Clean up stale sessions (older than 24 hours)
	const staleDuration = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
	for id, rec := range sessionRegistry {
		if now-rec.RegisteredAt > staleDuration {
			delete(sessionRegistry, id)
		}
	}
	sessionMu.Unlock()
}

func RegisterRegisterSessionContext(server *mcp.Server, _ *cdp.Session) {
	server.AddTool(&mcp.Tool{
		Name:        "register_session_context",
		Description: "Register Grip session picks for agent handshake (in-memory for this MCP process).",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"sessionId": map[string]interface{}{"type": "string"},
				"picks": map[string]interface{}{
					"type": "array",
					"items": map[string]interface{}{
						"type": "object",
					},
				},
			},
			"required": []string{"sessionId", "picks"},
		},
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
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"sessionId": map[string]interface{}{"type": "string"},
			},
			"required": []string{"sessionId"},
		},
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
