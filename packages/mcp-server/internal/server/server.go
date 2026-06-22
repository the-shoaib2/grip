package server

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"strconv"

	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/the-shoaib2/grip/packages/mcp-server/internal/cdp"
)

func Run(ctx context.Context, logger *slog.Logger, chromePort int) error {
	if p := os.Getenv("GRIP_CHROME_PORT"); p != "" {
		if n, err := strconv.Atoi(p); err == nil {
			chromePort = n
		}
	}

	session := cdp.NewSession(chromePort)
	if err := session.Connect(ctx); err != nil {
		return err
	}
	defer session.Close()

	logger.Info("connected to Chrome", "port", chromePort)

	server := mcp.NewServer(&mcp.Implementation{Name: "grip", Version: "0.1.0"}, nil)

	registerTools(server, session)

	return server.Run(ctx, &mcp.StdioTransport{})
}

func textResult(v interface{}) (*mcp.CallToolResult, error) {
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return nil, err
	}
	return &mcp.CallToolResult{
		Content: []mcp.Content{&mcp.TextContent{Text: string(b)}},
	}, nil
}

func registerTools(server *mcp.Server, s *cdp.Session) {
	mcp.AddTool(server, &mcp.Tool{
		Name:        "snapshot",
		Description: "Get the full accessibility tree + ref map of the current page.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, in struct {
		FrameID string `json:"frameId,omitempty" jsonschema:"optional iframe frame ID"`
	}) (*mcp.CallToolResult, error) {
		yaml, title, url, err := s.Snapshot(in.FrameID)
		if err != nil {
			return nil, err
		}
		return textResult(map[string]interface{}{
			"yaml": yaml, "refs": s.AllRefs(), "title": title, "url": url,
		})
	})

	mcp.AddTool(server, &mcp.Tool{
		Name:        "highlight",
		Description: "Draw a visible blue overlay on the element for confirmation.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, in struct {
		Ref string `json:"ref" jsonschema:"element ref from snapshot"`
	}) (*mcp.CallToolResult, error) {
		if err := s.Highlight(in.Ref); err != nil {
			return nil, err
		}
		return textResult(map[string]interface{}{"success": true, "ref": in.Ref})
	})

	mcp.AddTool(server, &mcp.Tool{
		Name:        "click",
		Description: "Click an element by ref.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, in struct {
		Ref string `json:"ref" jsonschema:"element ref from snapshot"`
	}) (*mcp.CallToolResult, error) {
		if err := s.Click(in.Ref); err != nil {
			return nil, err
		}
		return textResult(map[string]interface{}{"success": true, "ref": in.Ref})
	})

	mcp.AddTool(server, &mcp.Tool{
		Name:        "fill",
		Description: "Type into an input or textarea.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, in struct {
		Ref   string `json:"ref" jsonschema:"element ref from snapshot"`
		Value string `json:"value" jsonschema:"text to type"`
	}) (*mcp.CallToolResult, error) {
		if err := s.Fill(in.Ref, in.Value); err != nil {
			return nil, err
		}
		return textResult(map[string]interface{}{"success": true, "ref": in.Ref, "value": in.Value})
	})

	mcp.AddTool(server, &mcp.Tool{
		Name:        "read_logs",
		Description: "Returns buffered console output from the page.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, in struct {
		Level string `json:"level,omitempty" jsonschema:"log|warn|error|all"`
	}) (*mcp.CallToolResult, error) {
		return textResult(s.ReadLogs(in.Level))
	})

	mcp.AddTool(server, &mcp.Tool{
		Name:        "read_network",
		Description: "Returns recent network requests as HAR entries.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, in struct {
		Filter *struct {
			URL    string `json:"url,omitempty"`
			Method string `json:"method,omitempty"`
			Status int64  `json:"status,omitempty"`
		} `json:"filter,omitempty"`
	}) (*mcp.CallToolResult, error) {
		url, method, status := "", "", int64(0)
		if in.Filter != nil {
			url, method, status = in.Filter.URL, in.Filter.Method, in.Filter.Status
		}
		return textResult(s.ReadNetwork(url, method, status))
	})

	mcp.AddTool(server, &mcp.Tool{
		Name:        "screenshot",
		Description: "Capture a screenshot of the full page or a specific element.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, in struct {
		Selector string `json:"selector,omitempty" jsonschema:"optional ref to scope screenshot"`
	}) (*mcp.CallToolResult, error) {
		buf, err := s.Screenshot(in.Selector)
		if err != nil {
			return nil, err
		}
		return textResult(map[string]interface{}{
			"format": "png",
			"base64": base64.StdEncoding.EncodeToString(buf),
		})
	})

	mcp.AddTool(server, &mcp.Tool{
		Name:        "pick_element",
		Description: "Activate visual element picker. User clicks an element; returns metadata.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, _ struct{}) (*mcp.CallToolResult, error) {
		picked, err := s.PickElement(ctx)
		if err != nil {
			return nil, err
		}
		return textResult(picked)
	})

	mcp.AddTool(server, &mcp.Tool{
		Name:        "navigate",
		Description: "Navigate to URL and invalidate refs.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, in struct {
		URL string `json:"url" jsonschema:"destination URL"`
	}) (*mcp.CallToolResult, error) {
		if err := s.Navigate(in.URL); err != nil {
			return nil, err
		}
		return textResult(map[string]interface{}{"success": true, "url": in.URL})
	})

	mcp.AddTool(server, &mcp.Tool{
		Name:        "eval",
		Description: "Runtime.evaluate in page context.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest, in struct {
		JS string `json:"js" jsonschema:"JavaScript expression"`
	}) (*mcp.CallToolResult, error) {
		result, err := s.Eval(in.JS)
		if err != nil {
			return nil, err
		}
		return textResult(map[string]interface{}{"result": result})
	})

	_ = fmt.Sprintf
}
