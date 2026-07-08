package main

import (
	"context"
	"flag"
	"log/slog"
	"os"

	"github.com/the-shoaib2/grip/packages/mcp-server/internal/server"
)

func main() {
	port := flag.Int("port", 9222, "Chrome remote debugging port")
	isDaemon := flag.Bool("background", false, "Run in background mode (HTTP bridge only, no stdio)")
	flag.Parse()

	level := slog.LevelInfo
	switch os.Getenv("GRIP_LOG_LEVEL") {
	case "debug":
		level = slog.LevelDebug
	case "warn":
		level = slog.LevelWarn
	case "error":
		level = slog.LevelError
	}

	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: level}))

	if err := server.Run(context.Background(), logger, *port, *isDaemon); err != nil {
		logger.Error("grip-mcp failed", "error", err)
		os.Exit(1)
	}
}
