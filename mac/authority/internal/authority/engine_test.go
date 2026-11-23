package authority

import (
	"encoding/json"
	"fmt"
	"path/filepath"
	"sync"
	"testing"
	"time"
)

type testClock struct{ at time.Time }

func (c *testClock) now() time.Time       { return c.at }
func (c *testClock) jump(d time.Duration) { c.at = c.at.Add(d) }
func setup(t *testing.T) (*Engine, *testClock, string) {
	t.Helper()
	c := &testClock{at: time.Now()}
	path := filepath.Join(t.TempDir(), "state.json")
	e, err := New(path, c.now)
	if err != nil {
		t.Fatal(err)
	}
	return e, c, path
}
func action(s State, id string, typ string, payload string) Command {
	return Command{Protocol: 2, GameID: s.GameID, Sport: s.Sport, ID: id, ExpectedRevision: s.Revision, Type: typ, Payload: json.RawMessage(payload)}
}
func TestClockCountsActualElapsedAndPauses(t *testing.T) {
	e, c, _ := setup(t)
	s := e.Read()
	a := e.Apply(action(s, "start_0000001", "clock.start", "{}"))
	if a.Status != "applied" {
		t.Fatal(a)
	}
	c.jump(3 * time.Second)
	if got := e.Read().Clock.RemainingMs; got != 717000 {
		t.Fatalf("wanted 717000, got %d", got)
	}
	c.jump(57 * time.Second)
	if got := e.Read().Clock.RemainingMs; got != 660000 {
		t.Fatalf("wanted 660000, got %d", got)
	}
	s = e.Read()
	a = e.Apply(action(s, "stop_00000001", "clock.stop", "{}"))
	if a.Status != "applied" {
		t.Fatal(a)
	}
	c.jump(200 * time.Second)
	if got := e.Read().Clock.RemainingMs; got != 660000 {
		t.Fatalf("clock moved while paused: %d", got)
	}
}
func TestDurableDedupAcrossRestart(t *testing.T) {
	e, c, path := setup(t)
	s := e.Read()
	a := action(s, "touchdown_00001", "score.add", `{"team":"home","points":6}`)
	if got := e.Apply(a); got.Status != "applied" {
		t.Fatal(got)
	}
	restarted, err := New(path, c.now)
	if err != nil {
		t.Fatal(err)
	}
	dup := restarted.Apply(a)
	if dup.Status != "duplicate" || !dup.Duplicate {
		t.Fatalf("not duplicate: %+v", dup)
	}
	if got := restarted.Read(); got.HomeScore != 6 || got.Revision != 1 {
		t.Fatalf("double applied: %+v", got)
	}
	a.Payload = json.RawMessage(`{"team":"home","points":7}`)
	if got := restarted.Apply(a); got.Status != "id_conflict" {
		t.Fatalf("did not detect reused ID: %+v", got)
	}
}
func TestCrashRecoveryCheckpointPausesAndAdvancesRevision(t *testing.T) {
	e, c, path := setup(t)
	s := e.Read()
	if a := e.Apply(action(s, "clock_000001", "clock.start", "{}")); a.Status != "applied" {
		t.Fatal(a)
	}
	c.jump(22 * time.Second)
	if err := e.Checkpoint(); err != nil {
		t.Fatal(err)
	}
	after, err := New(path, c.now)
	if err != nil {
		t.Fatal(err)
	}
	s = after.Read()
	if s.Clock.Running || s.Clock.RemainingMs != 698000 || s.Revision != 2 {
		t.Fatalf("unexpected recovered state: %+v", s)
	}
	c.jump(60 * time.Second)
	if got := after.Read().Clock.RemainingMs; got != 698000 {
		t.Fatal(got)
	}
}
func TestRevisionRaceOnlyOneCommandAccepted(t *testing.T) {
	e, _, _ := setup(t)
	s := e.Read()
	var wg sync.WaitGroup
	result := make(chan Ack, 100)
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			result <- e.Apply(action(s, fmt.Sprintf("race_%08d", i), "score.add", `{"team":"away","points":1}`))
		}(i)
	}
	wg.Wait()
	close(result)
	applied := 0
	for a := range result {
		if a.Status == "applied" {
			applied++
		} else if a.Status != "conflict" {
			t.Errorf("unexpected status %s", a.Status)
		}
	}
	if applied != 1 || e.Read().AwayScore != 1 {
		t.Fatalf("accepted %d commands, score %d", applied, e.Read().AwayScore)
	}
}
func TestGameIsolatedAndReset(t *testing.T) {
	e, _, _ := setup(t)
	s := e.Read()
	after, err := e.NewGame("lacrosse", s.GameID)
	if err != nil {
		t.Fatal(err)
	}
	if after.Sport != "lacrosse" || after.Revision != 0 || after.GameID == s.GameID {
		t.Fatal(after)
	}
	if a := e.Apply(action(s, "oldgame_00001", "score.add", `{"team":"home","points":6}`)); a.Status != "conflict" {
		t.Fatal(a)
	}
	if _, err = e.NewGame("football", s.GameID); err == nil {
		t.Fatal("allowed stale game")
	}
}
func TestExpiryFinalizedByCheckpoint(t *testing.T) {
	e, c, _ := setup(t)
	s := e.Read()
	if a := e.Apply(action(s, "reset_000001", "clock.reset", `{"remainingMs":1000}`)); a.Status != "applied" {
		t.Fatal(a)
	}
	s = e.Read()
	e.Apply(action(s, "start_000001", "clock.start", "{}"))
	c.jump(1500 * time.Millisecond)
	if e.Read().Clock.RemainingMs != 0 {
		t.Fatal("not expired")
	}
	if err := e.Checkpoint(); err != nil {
		t.Fatal(err)
	}
	after := e.Read()
	if after.Clock.Running || after.Clock.RemainingMs != 0 || after.Revision != 3 {
		t.Fatal(after)
	}
}
func TestInvalidDeltaAndScoreCannotCorrupt(t *testing.T) {
	e, _, _ := setup(t)
	s := e.Read()
	for _, p := range []string{`{"team":"home","points":50}`, `{"team":"home","points":-1}`, `{"team":"other","points":1}`} {
		a := e.Apply(action(s, "invalid_00001", "score.add", p))
		if a.Status != "invalid" {
			t.Fatal(a)
		}
	}
	if e.Read().Revision != 0 {
		t.Fatal("invalid request mutated")
	}
}
