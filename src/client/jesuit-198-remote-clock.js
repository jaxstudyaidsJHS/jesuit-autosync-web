/* Jesuit Scoreboards v1.9.8 remote clock display.
 * Display-only interpolation: no writes, score changes, or authority claims.
 * Uses monotonic time between confirmed Mac state responses, then re-anchors.
 * A stale Mac sample freezes the preview and exposes an uncertainty suffix.
 */
(function (root, factory) {
  'use strict';
  var exposed = factory();
  if (typeof module === 'object' && module.exports) module.exports = exposed;
  root.JesuitRemoteClock198 = exposed;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var CLOCK_STALE_MS = 6500;
  function finite(v) { return typeof v === 'number' && Number.isFinite(v); }
  function parseFootball(v) {
    var x = /^\s*(\d{1,3}):(\d\d)\s*$/.exec(String(v == null ? '' : v));
    if (!x || Number(x[2]) > 59) return null;
    return Number(x[1]) * 60 + Number(x[2]);
  }
  function asTime(seconds) {
    var s = Math.max(0, Math.floor(seconds));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function create(options) {
    options = options || {};
    var monotonic = options.monotonic || function () { return performance.now(); };
    var wall = options.wall || function () { return Date.now(); };
    var staleAfter = finite(options.staleAfter) && options.staleAfter > 0 ? options.staleAfter : CLOCK_STALE_MS;
    var sample = null;
    function clear() { sample = null; }
    function capture(sport, state) {
      var now = monotonic(), epoch = wall(), c, ms, running = false, label = '', mode = 'ceil', fingerprint = null, staleAtSource = false;
      if (!state || !sport) return clear();
      if (sport === 'baseball') {
        sample = {sport: sport, stamp: now, running: false, isStatic: true,
          staticLabel: 'Inning ' + (state.game && state.game.inning || 1) + ' · ' + (state.game && state.game.half || 'TOP')};
        return;
      }
      if (sport === 'football') {
        var secs = parseFootball(state.clock);
        if (secs === null) return clear();
        ms = secs * 1000;
        staleAtSource = state.__jesuitClockRunning === true &&
          finite(Number(state.__jesuitClockSampleAt)) && Number(state.__jesuitClockSampleAt) > 0 &&
          epoch - Number(state.__jesuitClockSampleAt) > staleAfter;
        // Never infer running from an old game clock string: explicit controller flag only.
        running = state.__jesuitClockRunning === true && state.quarter !== 'FINAL';
        if (state.quarter === 'FINAL') {
          sample = {sport: sport, stamp: now, running: false, isStatic: true, staticLabel: 'FINAL'};
          return;
        }
        label = ' · Q' + String(state.quarter == null ? '1' : state.quarter);
      } else if (sport === 'lacrosse') {
        if (!state.game) return clear();
        ms = Number(state.game.clockMs);
        if (!finite(ms)) return clear();
        running = state.game.running === true && state.game.period !== 'FINAL';
        label = ' · ' + String(state.game.period || '1ST');
        mode = 'floor'; // Match the lacrosse controller/scoreboard display convention.
      } else if (sport === 'basketball' || sport === 'soccer') {
        c = state.game && state.game.clock;
        if (!c || !finite(Number(c.seconds))) return clear();
        running = c.running === true;
        if (sport === 'basketball' && state.game.period === 'FINAL') running = false;
        if (sport === 'soccer' && state.game.stage === 'FINAL') running = false;
        ms = Math.max(0, Number(c.seconds) * 1000);
        // These controllers keep seconds as a start value and endAt as a deadline.
        // The endAt field is the current Mac clock target, not an elapsed counter.
        if (running && finite(Number(c.endAt)) && Number(c.endAt) > 0) {
          var until = Number(c.endAt) - epoch;
          // If the phone's wall clock is wildly different, show an uncertain stopped
          // sample rather than confidently counting from a corrupt deadline.
          if (until > -2000 && until <= Math.max(0, Number(c.seconds) * 1000) + 3000) {
            ms = Math.max(0, until);
          } else {
            running = false;
          }
        } else if (running) {
          // No verified endAt -> do not manufacture a clock progression.
          running = false;
        }
        label = sport === 'basketball' ? ' · ' + (state.game.period || '1ST') : ' · ' + (state.game.stage || '1H');
      } else return clear();
      fingerprint = JSON.stringify([sport, ms, running, label, mode,
        sport === 'football' ? Number(state.__jesuitClockSampleAt) || null : null]);
      if (sample && sample.fingerprint === fingerprint && sample.running === running) {
        // Duplicate Mac snapshot: do not restart a local countdown from old seconds.
        if (staleAtSource) sample.staleAtSource = true;
        return;
      }
      sample = {sport: sport, stamp: now, remainingMs: Math.max(0, ms), running: running,
        label: label, mode: mode, fingerprint: fingerprint, staleAtSource: staleAtSource};
    }
    function current() {
      if (!sample) return {text: '--:--', running: false, stale: true};
      if (sample.isStatic) return {text: sample.staticLabel, running: false, stale: false};
      var age = Math.max(0, monotonic() - sample.stamp);
      var stale = sample.running && (age > staleAfter || sample.staleAtSource);
      var elapsed = sample.running ? Math.min(age, staleAfter) : 0;
      var rem = Math.max(0, sample.remainingMs - elapsed);
      var sec = sample.mode === 'floor' ? Math.floor(rem / 1000) : Math.ceil(rem / 1000);
      // No more than one tick/sec locally; fresh Mac replies can correct the value.
      var timeText = asTime(sec);
      if (sample.sport === 'football') timeText = timeText.padStart(timeText.length + (timeText.indexOf(':') === 1 ? 1 : 0), '0');
      return {time: timeText, text: timeText + sample.label + (stale ? ' · CHECK SYNC' : ''),
        running: sample.running && rem > 0 && !stale, stale: stale};
    }
    return {capture: capture, current: current, clear: clear};
  }
  return {create: create, parseFootball: parseFootball, asTime: asTime};
});
