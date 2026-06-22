package cdp

import (
	"fmt"
	"strings"
	"time"

	"github.com/chromedp/cdproto/log"
	"github.com/chromedp/cdproto/network"
	"github.com/chromedp/cdproto/runtime"
	"github.com/chromedp/chromedp"
)

type pendingRequest struct {
	url    string
	method string
	start  string
}

func (s *Session) WireListeners() {
	pending := make(map[network.RequestID]pendingRequest)

	chromedp.ListenTarget(s.ctx, func(ev interface{}) {
		switch ev := ev.(type) {
		case *runtime.EventConsoleAPICalled:
			msg := formatConsoleArgs(ev.Args)
			level := string(ev.Type)
			stack := ""
			if ev.StackTrace != nil && len(ev.StackTrace.CallFrames) > 0 {
				f := ev.StackTrace.CallFrames[0]
				stack = fmt.Sprintf("%s:%d", f.URL, f.LineNumber)
			}
			s.AddLog(level, msg, stack)

		case *log.EventEntryAdded:
			level := strings.ToLower(string(ev.Entry.Level))
			if level == "warning" {
				level = "warn"
			}
			s.AddLog(level, ev.Entry.Text, "")

		case *network.EventRequestWillBeSent:
			pending[ev.RequestID] = pendingRequest{
				url:    ev.Request.URL,
				method: ev.Request.Method,
				start:  time.Now().Format(time.RFC3339),
			}

		case *network.EventResponseReceived:
			req, ok := pending[ev.RequestID]
			if !ok {
				req = pendingRequest{url: ev.Response.URL, method: "GET", start: time.Now().Format(time.RFC3339)}
			}
			s.AddNetwork(HarEntry{
				RequestID:       string(ev.RequestID),
				URL:             req.url,
				Method:          req.method,
				Status:          ev.Response.Status,
				StatusText:      ev.Response.StatusText,
				MimeType:        ev.Response.MimeType,
				StartedDateTime: req.start,
			})
			delete(pending, ev.RequestID)
		}
	})
}

func formatConsoleArgs(args []*runtime.RemoteObject) string {
	parts := make([]string, 0, len(args))
	for _, a := range args {
		if a.Value != nil {
			parts = append(parts, fmt.Sprint(a.Value))
		} else if a.Description != "" {
			parts = append(parts, a.Description)
		}
	}
	return strings.Join(parts, " ")
}
