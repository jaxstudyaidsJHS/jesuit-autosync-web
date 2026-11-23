package authority

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func localRequest(method, path, content string) *http.Request {
	r := httptest.NewRequest(method, "http://127.0.0.1:8784"+path, strings.NewReader(content))
	r.Host = "127.0.0.1:8784"
	return r
}
func TestHTTPOnlySameOriginAuthorizedCommands(t *testing.T) {
	e, _, _ := setup(t)
	s, err := NewService(e, "http://127.0.0.1:8784")
	if err != nil {
		t.Fatal(err)
	}
	state := e.Read()
	command, _ := json.Marshal(action(state, "command_00001", "score.add", `{"team":"home","points":1}`))
	cases := []struct {
		origin, token, host string
		want                int
	}{
		{"https://untrusted.test", s.token, "127.0.0.1:8784", 403},
		{"http://127.0.0.1:8784", "wrong", "127.0.0.1:8784", 403},
		{"", s.token, "127.0.0.1:8784", 403},
		{"http://127.0.0.1:8784", s.token, "other.test", 403},
		{"http://127.0.0.1:8784", s.token, "127.0.0.1:8784", 200},
	}
	for _, c := range cases {
		r := httptest.NewRequest("POST", "http://127.0.0.1:8784/api/v2/commands", bytes.NewReader(command))
		r.Header.Set("Origin", c.origin)
		r.Header.Set("X-Jesuit-Operator-Token", c.token)
		r.Header.Set("Content-Type", "application/json")
		r.Host = c.host
		w := httptest.NewRecorder()
		s.ServeHTTP(w, r)
		if w.Code != c.want {
			t.Fatalf("got %d want %d, body %s", w.Code, c.want, w.Body.String())
		}
	}
	if e.Read().HomeScore != 1 {
		t.Fatal("not exactly one score")
	}
}
func TestHTTPRejectsOversizedAndMalformed(t *testing.T) {
	e, _, _ := setup(t)
	s, _ := NewService(e, "http://127.0.0.1:8784")
	r := localRequest("POST", "/api/v2/commands", `{"extra":"`+strings.Repeat("X", 9000)+`"}`)
	r.Header.Set("Origin", "http://127.0.0.1:8784")
	r.Header.Set("Content-Type", "application/json")
	r.Header.Set("X-Jesuit-Operator-Token", s.token)
	w := httptest.NewRecorder()
	s.ServeHTTP(w, r)
	if w.Code != 400 {
		t.Fatalf("expected 400 got %d", w.Code)
	}
	if e.Read().Revision != 0 {
		t.Fatal("invalid request mutated")
	}
}
func TestStateReadDoesNotExposeOperatorToken(t *testing.T) {
	e, _, _ := setup(t)
	s, _ := NewService(e, "http://127.0.0.1:8784")
	w := httptest.NewRecorder()
	s.ServeHTTP(w, localRequest("GET", "/api/v2/state", ""))
	if w.Code != 200 || strings.Contains(w.Body.String(), s.token) {
		t.Fatal("token leak or failed state")
	}
}
