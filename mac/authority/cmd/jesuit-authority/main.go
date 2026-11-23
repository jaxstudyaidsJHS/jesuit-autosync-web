package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"

	"github.com/jaxstudyaidsJHS/jesuit-autosync-web/mac/authority/internal/authority"
)

func main() {
	home, err := os.UserHomeDir()
	if err != nil {
		log.Fatal(err)
	}
	dir := filepath.Join(home, "Library", "Application Support", "Jesuit Scoreboards Authority")
	if runtime.GOOS != "darwin" {
		dir = filepath.Join(home, ".jesuit-authority-prototype")
	}
	// Claim the local port BEFORE reading or writing state. A second launch must
	// never pause or alter the clock owned by the already-running first process.
	listener, err := net.Listen("tcp", "127.0.0.1:8784")
	if err != nil {
		fmt.Fprintln(os.Stderr, "Authority is already running, or its local port is unavailable. No state changed.")
		return
	}
	engine, err := authority.New(filepath.Join(dir, "state-v2.json"), nil)
	if err != nil {
		_ = listener.Close()
		log.Fatalf("Authority state invalid; no changes made: %v", err)
	}
	service, err := authority.NewService(engine, "http://127.0.0.1:8784")
	if err != nil {
		_ = listener.Close()
		log.Fatal(err)
	}
	stop := make(chan struct{})
	service.StartCheckpoints(stop)
	srv := &http.Server{Handler: service, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second, IdleTimeout: 20 * time.Second}
	service.SetShutdown(func() { _ = srv.Shutdown(context.Background()) })
	if runtime.GOOS == "darwin" {
		go func() { time.Sleep(350 * time.Millisecond); _ = exec.Command("open", "http://127.0.0.1:8784/").Run() }()
	}
	log.Println("OFF-AIR ONLY. Authority running at http://127.0.0.1:8784/")
	if err = srv.Serve(listener); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
	close(stop)
}
