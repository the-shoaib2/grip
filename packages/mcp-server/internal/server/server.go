package server

import (
	"context"
	"encoding/base64"
	"encoding/json"
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
		return textResult(map[string]interface{}{
			"yaml": yaml, "refs": s.AllRefs(), "title": title, "url": url,
		})
	})

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
		return textResult(map[string]interface{}{"success": true, "ref": in.Ref})
	})

	server.AddTool(&mcp.Tool{
		Name:        "click",
		Description: "Click an element by ref.",
	}, func(_ context.Context, req *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		var in struct {
			Ref string `json:"ref"`
		}
		if err := json.Unmarshal(req.Params.Arguments, &in); err != nil {
			return nil, err
		}
		if err := s.Click(in.Ref); err != nil {
			return nil, err
		}
		return textResult(map[string]interface{}{"success": true, "ref": in.Ref})
	})

	server.AddTool(&mcp.Tool{
		Name:        "fill",
		Description: "Type into an input or textarea.",
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
		return textResult(map[string]interface{}{"success": true, "ref": in.Ref, "value": in.Value})
	})

	server.AddTool(&mcp.Tool{
		Name:        "read_logs",
		Description: "Returns buffered console output from the page.",
	}, func(_ context.Context, req *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		var in struct {
			Level string `json:"level"`
		}
		_ = json.Unmarshal(req.Params.Arguments, &in)
		return textResult(s.ReadLogs(in.Level))
	})

	server.AddTool(&mcp.Tool{
		Name:        "read_network",
		Description: "Returns recent network requests as HAR entries.",
	}, func(_ context.Context, req *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		var in struct {
			Filter *struct {
				URL    string `json:"url"`
				Method string `json:"method"`
				Status int64  `json:"status"`
			} `json:"filter"`
		}
		_ = json.Unmarshal(req.Params.Arguments, &in)
		url, method, status := "", "", int64(0)
		if in.Filter != nil {
			url, method, status = in.Filter.URL, in.Filter.Method, in.Filter.Status
		}
		return textResult(s.ReadNetwork(url, method, status))
	})

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
		return textResult(map[string]interface{}{
			"format": "png",
			"base64": base64.StdEncoding.EncodeToString(buf),
		})
	})

	server.AddTool(&mcp.Tool{
		Name:        "pick_element",
		Description: "Activate visual element picker. User clicks an element; returns metadata.",
	}, func(ctx context.Context, _ *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		picked, err := s.PickElement(ctx)
		if err != nil {
			return nil, err
		}
		return textResult(picked)
	})

	server.AddTool(&mcp.Tool{
		Name:        "navigate",
		Description: "Navigate to URL and invalidate refs.",
	}, func(_ context.Context, req *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		var in struct {
			URL string `json:"url"`
		}
		if err := json.Unmarshal(req.Params.Arguments, &in); err != nil {
			return nil, err
		}
		if err := s.Navigate(in.URL); err != nil {
			return nil, err
		}
		return textResult(map[string]interface{}{"success": true, "url": in.URL})
	})

	server.AddTool(&mcp.Tool{
		Name:        "eval",
		Description: "Runtime.evaluate in page context.",
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
		return textResult(map[string]interface{}{"result": result})
	})
}
