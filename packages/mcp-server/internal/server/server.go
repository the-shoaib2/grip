package server

import (
	"context"
	"log/slog"
	"os"
	"strconv"

	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/the-shoaib2/grip/packages/mcp-server/internal/cdp"
	"github.com/the-shoaib2/grip/packages/mcp-server/internal/tools"
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
	tools.Register(server, session)

	return server.Run(ctx, &mcp.StdioTransport{})
}
