package authority

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

const maxRequestBytes = 8192

type Service struct {
	Engine     *Engine
	token      string
	Origin     string
	handler    http.Handler
	onShutdown func()
}

func NewService(engine *Engine, origin string) (*Service, error) {
	secret := make([]byte, 32)
	if _, err := rand.Read(secret); err != nil {
		return nil, err
	}
	s := &Service{Engine: engine, token: base64.RawURLEncoding.EncodeToString(secret), Origin: origin}
	mux := http.NewServeMux()
	mux.HandleFunc("/", s.home)
	mux.HandleFunc("/api/v2/health", s.health)
	mux.HandleFunc("/api/v2/state", s.state)
	mux.HandleFunc("/api/v2/commands", s.command)
	mux.HandleFunc("/api/v2/games", s.game)
	mux.HandleFunc("/api/v2/shutdown", s.shutdown)
	s.handler = mux
	return s, nil
}

func (s *Service) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Check the exact Host to limit DNS rebinding to the localhost-only server.
	if r.Host != "127.0.0.1:8784" && r.Host != "localhost:8784" && r.Host != "127.0.0.1" {
		http.Error(w, "unrecognized host", http.StatusForbidden)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Frame-Options", "DENY")
	w.Header().Set("Referrer-Policy", "no-referrer")
	w.Header().Set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
	s.handler.ServeHTTP(w, r)
}

func (s *Service) sameOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	// Safari normally sends Origin on JSON POST; fail closed if missing.
	return origin == "http://127.0.0.1:8784" || origin == "http://localhost:8784"
}

func (s *Service) requireOperator(w http.ResponseWriter, r *http.Request) bool {
	if r.Method != "POST" {
		w.Header().Set("Allow", "POST")
		http.Error(w, "method not allowed", 405)
		return false
	}
	if !s.sameOrigin(r) || r.Header.Get("X-Jesuit-Operator-Token") != s.token {
		http.Error(w, "operator session unavailable; reopen local dashboard", 403)
		return false
	}
	if !strings.HasPrefix(strings.ToLower(r.Header.Get("Content-Type")), "application/json") {
		http.Error(w, "application/json required", 415)
		return false
	}
	return true
}

func decodeBody(w http.ResponseWriter, r *http.Request, dest any) error {
	raw, err := io.ReadAll(http.MaxBytesReader(w, r.Body, maxRequestBytes))
	if err != nil {
		return err
	}
	decoder := json.NewDecoder(strings.NewReader(string(raw)))
	decoder.DisallowUnknownFields()
	if err = decoder.Decode(dest); err != nil {
		return err
	}
	if err = decoder.Decode(new(any)); !errors.Is(err, io.EOF) {
		return errors.New("extra JSON payload")
	}
	return nil
}

func jsonResponse(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func (s *Service) health(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "method not allowed", 405)
		return
	}
	jsonResponse(w, 200, map[string]any{"service": "jesuit-authority-prototype", "protocol": Protocol, "status": "off-air prototype", "version": "0.2.0"})
}

func (s *Service) state(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "method not allowed", 405)
		return
	}
	jsonResponse(w, 200, s.Engine.Read())
}

func (s *Service) command(w http.ResponseWriter, r *http.Request) {
	if !s.requireOperator(w, r) {
		return
	}
	var c Command
	if err := decodeBody(w, r, &c); err != nil {
		http.Error(w, "invalid JSON command", 400)
		return
	}
	ack := s.Engine.Apply(c)
	status := 200
	switch ack.Status {
	case "applied", "duplicate":
		status = 200
	case "conflict", "id_conflict":
		status = 409
	case "invalid":
		status = 400
	default:
		status = 503
	}
	jsonResponse(w, status, ack)
}

func (s *Service) game(w http.ResponseWriter, r *http.Request) {
	if !s.requireOperator(w, r) {
		return
	}
	var p struct {
		Sport          string `json:"sport"`
		ExpectedGameID string `json:"expectedGameId"`
		Confirm        string `json:"confirm"`
	}
	if err := decodeBody(w, r, &p); err != nil {
		http.Error(w, "invalid game JSON", 400)
		return
	}
	if p.Confirm != "START NEW OFF-AIR GAME" {
		http.Error(w, "explicit confirmation required", 400)
		return
	}
	next, err := s.Engine.NewGame(p.Sport, p.ExpectedGameID)
	if err != nil {
		http.Error(w, "game mismatch or invalid sport", 409)
		return
	}
	jsonResponse(w, 200, next)
}

func (s *Service) home(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	if r.Method != "GET" {
		http.Error(w, "method not allowed", 405)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	html := strings.ReplaceAll(dashboardHTML, "__OPERATOR_TOKEN__", s.token)
	_, _ = io.WriteString(w, html)
}

func (s *Service) StartCheckpoints(stop <-chan struct{}) {
	ticker := time.NewTicker(time.Second)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-stop:
				return
			case <-ticker.C:
				if err := s.Engine.Checkpoint(); err != nil {
					log.Printf("authority checkpoint FAILED: %v", err)
				}
			}
		}
	}()
}

func (s *Service) SetShutdown(fn func()) { s.onShutdown = fn }

func (s *Service) shutdown(w http.ResponseWriter, r *http.Request) {
	if !s.requireOperator(w, r) {
		return
	}
	if err := s.Engine.PauseForShutdown(); err != nil {
		jsonResponse(w, 503, map[string]string{"status": "unavailable", "reason": "failed to persist paused state"})
		return
	}
	jsonResponse(w, 200, map[string]string{"status": "stopped", "message": "Mac authority saved and paused"})
	if s.onShutdown != nil {
		go s.onShutdown()
	}
}
