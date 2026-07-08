package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/the-shoaib2/grip/packages/mcp-server/internal/cdp"
	"github.com/the-shoaib2/grip/packages/mcp-server/internal/tools"
)

func startHTTPServer(logger *slog.Logger) {
	mux := http.NewServeMux()
	mux.HandleFunc("/session", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var in struct {
			SessionID string                   `json:"sessionId"`
			Picks     []map[string]interface{} `json:"picks"`
		}
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			http.Error(w, "Bad request", http.StatusBadRequest)
			return
		}
		
		if in.SessionID == "" {
			in.SessionID = fmt.Sprintf("sess_%d", time.Now().UnixMilli())
		}

		tools.StoreSessionContext(in.SessionID, in.Picks)
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"ok":        true,
			"sessionId": in.SessionID,
			"pickCount": len(in.Picks),
		})
	})

	httpPort := os.Getenv("GRIP_HTTP_PORT")
	if httpPort == "" {
		httpPort = "9223"
	}

	logger.Info("starting HTTP bridge", "port", httpPort)
	if err := http.ListenAndServe("127.0.0.1:"+httpPort, mux); err != nil {
		logger.Error("HTTP server error", "error", err)
	}
}

func Run(ctx context.Context, logger *slog.Logger, chromePort int, isDaemon bool) error {
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
	tools.Register(server, session)

	go startHTTPServer(logger)

	if isDaemon {
		logger.Info("running in background daemon mode")
		
		// Setup context cancel listener on OS signals to shut down cleanly
		ctx, cancel := context.WithCancel(ctx)
		defer cancel()
		
		<-ctx.Done()
		return nil
	}

	return server.Run(ctx, &mcp.StdioTransport{})
}
