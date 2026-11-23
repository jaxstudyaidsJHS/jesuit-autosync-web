package authority

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"sync"
	"time"
)

const Protocol = 2
const MaxJournalEntries = 50000

var validSports = map[string]int64{"football": 720000, "basketball": 480000, "lacrosse": 720000, "soccer": 2400000, "baseball": 0}

type Clock struct {
	RemainingMs int64 `json:"remainingMs"`
	Running     bool  `json:"running"`
	deadline    time.Time
}

type State struct {
	Protocol  int    `json:"protocol"`
	GameID    string `json:"gameId"`
	Sport     string `json:"sport"`
	Revision  uint64 `json:"revision"`
	HomeScore int    `json:"homeScore"`
	AwayScore int    `json:"awayScore"`
	Period    int    `json:"period"`
	Clock     Clock  `json:"clock"`
}

type Command struct {
	Protocol         int             `json:"protocol"`
	GameID           string          `json:"gameId"`
	Sport            string          `json:"sport"`
	ID               string          `json:"id"`
	ExpectedRevision uint64          `json:"expectedRevision"`
	Type             string          `json:"type"`
	Payload          json.RawMessage `json:"payload"`
}

type Ack struct {
	Status    string `json:"status"`
	CommandID string `json:"commandId"`
	Revision  uint64 `json:"revision"`
	Reason    string `json:"reason,omitempty"`
	Duplicate bool   `json:"duplicate,omitempty"`
}

type journalEntry struct {
	Hash string `json:"hash"`
	Ack  Ack    `json:"ack"`
}

type diskState struct {
	Version int                     `json:"version"`
	State   State                   `json:"state"`
	Journal map[string]journalEntry `json:"journal"`
}

type Engine struct {
	mu      sync.Mutex
	file    string
	state   State
	journal map[string]journalEntry
	now     func() time.Time
}

func generatedID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func initialState(sport string) (State, error) {
	ms, ok := validSports[sport]
	if !ok {
		return State{}, errors.New("unsupported sport")
	}
	id, err := generatedID()
	if err != nil {
		return State{}, err
	}
	return State{Protocol: Protocol, GameID: id, Sport: sport, Period: 1, Clock: Clock{RemainingMs: ms}}, nil
}

func New(file string, now func() time.Time) (*Engine, error) {
	if now == nil {
		now = time.Now
	}
	e := &Engine{file: file, now: now, journal: map[string]journalEntry{}}
	raw, err := os.ReadFile(file)
	if errors.Is(err, os.ErrNotExist) {
		e.state, err = initialState("football")
		if err != nil {
			return nil, err
		}
		if err = e.persist(e.state, e.journal); err != nil {
			return nil, err
		}
		return e, nil
	}
	if err != nil {
		return nil, err
	}
	var disk diskState
	if err = json.Unmarshal(raw, &disk); err != nil {
		return nil, fmt.Errorf("cannot load authority state: %w", err)
	}
	if disk.Version != 1 || disk.State.Protocol != Protocol || disk.State.GameID == "" {
		return nil, errors.New("stored state version incompatible; do not overwrite")
	}
	if _, ok := validSports[disk.State.Sport]; !ok {
		return nil, errors.New("stored sport invalid")
	}
	if disk.State.Clock.RemainingMs < 0 {
		return nil, errors.New("stored clock invalid")
	}
	if disk.Journal == nil {
		disk.Journal = map[string]journalEntry{}
	}
	if len(disk.Journal) > MaxJournalEntries {
		return nil, errors.New("stored command journal too large")
	}
	// The persisted value is a 1-second checkpoint. On restart we PAUSE it.
	if disk.State.Clock.Running {
		disk.State.Revision++
	}
	disk.State.Clock.Running = false
	disk.State.Clock.deadline = time.Time{}
	e.state = disk.State
	e.journal = disk.Journal
	if err = e.persist(e.state, e.journal); err != nil {
		return nil, err
	}
	return e, nil
}

func (e *Engine) rendered(s State, at time.Time) State {
	if s.Clock.Running {
		remain := s.Clock.deadline.Sub(at)
		if remain <= 0 {
			s.Clock.RemainingMs = 0
			s.Clock.Running = false
			s.Clock.deadline = time.Time{}
		} else {
			s.Clock.RemainingMs = int64(math.Ceil(float64(remain) / float64(time.Millisecond)))
		}
	}
	return s
}

func (e *Engine) Read() State {
	e.mu.Lock()
	defer e.mu.Unlock()
	return e.rendered(e.state, e.now())
}

func (e *Engine) persist(s State, j map[string]journalEntry) error {
	dir := filepath.Dir(e.file)
	if err := os.MkdirAll(dir, 0700); err != nil {
		return err
	}
	// Running deadlines are NOT valid after process restart: persist remaining time only.
	s.Clock.deadline = time.Time{}
	encoded, err := json.MarshalIndent(diskState{Version: 1, State: s, Journal: j}, "", "  ")
	if err != nil {
		return err
	}
	tmp, err := os.CreateTemp(dir, ".jesuit-authority-*")
	if err != nil {
		return err
	}
	defer os.Remove(tmp.Name())
	if err = tmp.Chmod(0600); err != nil {
		tmp.Close()
		return err
	}
	if _, err = tmp.Write(encoded); err != nil {
		tmp.Close()
		return err
	}
	if err = tmp.Sync(); err != nil {
		tmp.Close()
		return err
	}
	if err = tmp.Close(); err != nil {
		return err
	}
	if err = os.Rename(tmp.Name(), e.file); err != nil {
		return err
	}
	if d, err := os.Open(dir); err == nil {
		_ = d.Sync()
		_ = d.Close()
	}
	return nil
}

func validateID(id string) bool {
	if len(id) < 8 || len(id) > 128 {
		return false
	}
	for _, c := range id {
		if !(c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9' || c == '-' || c == '_') {
			return false
		}
	}
	return true
}

func parsePayload(raw json.RawMessage, target any) error {
	if len(raw) == 0 {
		return errors.New("missing payload")
	}
	if raw[0] != '{' {
		return errors.New("payload must be JSON object")
	}
	return json.Unmarshal(raw, target)
}

func (e *Engine) Apply(c Command) Ack {
	e.mu.Lock()
	defer e.mu.Unlock()
	reply := Ack{Status: "invalid", CommandID: c.ID, Revision: e.state.Revision}
	if c.Protocol != Protocol {
		reply.Reason = "protocol version mismatch"
		return reply
	}
	if !validateID(c.ID) {
		reply.Reason = "invalid command ID"
		return reply
	}
	if c.GameID != e.state.GameID || c.Sport != e.state.Sport {
		reply.Status = "conflict"
		reply.Reason = "wrong game or sport"
		return reply
	}
	rawHash, _ := json.Marshal(c)
	hash := sha256.Sum256(rawHash)
	h := hex.EncodeToString(hash[:])
	if prior, ok := e.journal[c.ID]; ok {
		if prior.Hash != h {
			reply.Status = "id_conflict"
			reply.Reason = "command ID already used for different payload"
			return reply
		}
		p := prior.Ack
		p.Status = "duplicate"
		p.Duplicate = true
		return p
	}
	if c.ExpectedRevision != e.state.Revision {
		reply.Status = "conflict"
		reply.Reason = "revision has changed"
		return reply
	}
	if len(e.journal) >= MaxJournalEntries {
		reply.Status = "unavailable"
		reply.Reason = "command journal at capacity; start a new game safely"
		return reply
	}

	now := e.now()
	next := e.rendered(e.state, now)
	switch c.Type {
	case "score.set", "score.add":
		var p struct {
			Team   string `json:"team"`
			Points int    `json:"points"`
		}
		if err := parsePayload(c.Payload, &p); err != nil || (p.Team != "home" && p.Team != "away") {
			reply.Reason = "invalid team/score payload"
			return reply
		}
		if c.Type == "score.add" && (p.Points == 0 || p.Points < -10 || p.Points > 10) {
			reply.Reason = "invalid score delta"
			return reply
		}
		if c.Type == "score.set" && (p.Points < 0 || p.Points > 999) {
			reply.Reason = "score outside 0..999"
			return reply
		}
		v := next.HomeScore
		if p.Team == "away" {
			v = next.AwayScore
		}
		if c.Type == "score.set" {
			v = p.Points
		} else {
			v += p.Points
		}
		if v < 0 || v > 999 {
			reply.Reason = "resulting score out of range"
			return reply
		}
		if p.Team == "home" {
			next.HomeScore = v
		} else {
			next.AwayScore = v
		}
	case "period.set":
		var p struct {
			Period int `json:"period"`
		}
		if err := parsePayload(c.Payload, &p); err != nil || p.Period < 1 || p.Period > 20 {
			reply.Reason = "invalid period"
			return reply
		}
		next.Period = p.Period
	case "clock.start":
		if !next.Clock.Running && next.Clock.RemainingMs > 0 {
			next.Clock.Running = true
			next.Clock.deadline = now.Add(time.Duration(next.Clock.RemainingMs) * time.Millisecond)
		}
	case "clock.stop":
		next.Clock.Running = false
		next.Clock.deadline = time.Time{}
	case "clock.reset":
		var p struct {
			RemainingMs int64 `json:"remainingMs"`
		}
		if err := parsePayload(c.Payload, &p); err != nil || p.RemainingMs < 0 || p.RemainingMs > 86400000 {
			reply.Reason = "invalid clock reset"
			return reply
		}
		next.Clock.RemainingMs = p.RemainingMs
		next.Clock.Running = false
		next.Clock.deadline = time.Time{}
	default:
		reply.Reason = "unsupported command type"
		return reply
	}
	// The persisted deadline holds the *current* remaining amount. Sync to disk
	// before making this command visible. The ID is durably recorded together.
	next.Revision++
	stored := e.rendered(next, now)
	reply.Status = "applied"
	reply.Revision = next.Revision
	reply.Reason = ""
	journalCopy := make(map[string]journalEntry, len(e.journal)+1)
	for k, v := range e.journal {
		journalCopy[k] = v
	}
	journalCopy[c.ID] = journalEntry{Hash: h, Ack: reply}
	if err := e.persist(stored, journalCopy); err != nil {
		reply.Status = "unavailable"
		reply.Reason = "state persistence failed; no change applied"
		reply.Revision = e.state.Revision
		return reply
	}
	e.state = next
	e.journal = journalCopy
	return reply
}

func (e *Engine) Checkpoint() error {
	e.mu.Lock()
	defer e.mu.Unlock()
	at := e.now()
	s := e.rendered(e.state, at)
	if s.Clock.Running != e.state.Clock.Running && !s.Clock.Running {
		s.Revision++
	}
	if err := e.persist(s, e.journal); err != nil {
		return err
	}
	// Keep original monotonic deadline while running; update only expiry state.
	if !s.Clock.Running {
		e.state = s
	}
	return nil
}

func (e *Engine) NewGame(sport string, expectedGameID string) (State, error) {
	e.mu.Lock()
	defer e.mu.Unlock()
	if e.state.GameID != expectedGameID {
		return State{}, errors.New("active game changed")
	}
	next, err := initialState(sport)
	if err != nil {
		return State{}, err
	}
	journal := map[string]journalEntry{}
	if err = e.persist(next, journal); err != nil {
		return State{}, err
	}
	e.state = next
	e.journal = journal
	return next, nil
}

// PauseForShutdown commits a stopped clock and its remaining duration before
// terminating the off-air authority. A clean exit must not imply a running clock.
func (e *Engine) PauseForShutdown() error {
	e.mu.Lock()
	defer e.mu.Unlock()
	next := e.rendered(e.state, e.now())
	if e.state.Clock.Running {
		next.Revision++
	}
	next.Clock.Running = false
	next.Clock.deadline = time.Time{}
	if err := e.persist(next, e.journal); err != nil {
		return err
	}
	e.state = next
	return nil
}
