import assert from "node:assert/strict";
import test from "node:test";
import { gameDestination, legacySeatRelay, LEGACY_GAME_ORIGIN, requestedGameRoom } from "../src/feud-embed.ts";

const seat = { code: "ABCDEF", playerId: "95daa33b-4d3c-4fb5-b1df-46549817cd1b", token: "A".repeat(43) };
const gameOrigin = "https://managed-game.example.org";

function relayFixture(requestedCode = seat.code) {
  const messages = [];
  let closed = 0;
  const gameWindow = { postMessage: (...args) => messages.push(args) };
  const legacyWindow = {};
  const relay = legacySeatRelay({ gameWindow, legacyWindow, gameOrigin, requestedCode, closeProbe: () => closed++ });
  const legacy = (session = seat) => ({ origin: LEGACY_GAME_ORIGIN, source: legacyWindow, data: { type: "feud:legacy-seat", session } });
  const ready = { origin: gameOrigin, source: gameWindow, data: { type: "feud:seat-ready" } };
  return { relay, messages, legacy, ready, closed: () => closed };
}

test("game destinations forward only a valid room code to separate fixed origins", () => {
  const production = gameDestination("production", "?room=abcdef&token=secret&destination=https://attacker.example/");
  const staging = gameDestination("staging", "?room=abcdef");
  assert.equal(production.search, "?room=ABCDEF");
  assert.equal(staging.search, production.search);
  assert.notEqual(production.origin, staging.origin);
  assert.equal(gameDestination("production", "?room=ABCDEFtooLong&token=secret").search, "");
  assert.equal(requestedGameRoom("?room=%3Cscript%3E"), null);
});

test("a legacy seat arriving before the game is ready waits for the managed handshake", () => {
  const fixture = relayFixture();
  fixture.relay.receive(fixture.legacy({ ...seat, discarded: "extra" }));
  assert.equal(fixture.messages.length, 0);
  fixture.relay.receive(fixture.ready);
  assert.deepEqual(fixture.messages, [[{ type: "feud:restore-seat", session: seat }, gameOrigin]]);
  assert.equal(fixture.closed(), 0);
});

test("a game arriving first receives the seat when the legacy frame answers", () => {
  const fixture = relayFixture();
  fixture.relay.receive(fixture.ready);
  fixture.relay.receive(fixture.legacy());
  assert.deepEqual(fixture.messages, [[{ type: "feud:restore-seat", session: seat }, gameOrigin]]);
});

test("source windows, origins, credential syntax, and requested code protect the relay", () => {
  const fixture = relayFixture();
  fixture.relay.receive({ ...fixture.ready, source: {} });
  fixture.relay.receive({ ...fixture.ready, origin: "https://attacker.example" });
  fixture.relay.receive(fixture.legacy());
  assert.equal(fixture.messages.length, 0);
  fixture.relay.receive(fixture.ready);
  assert.equal(fixture.messages.length, 1);

  const guarded = relayFixture();
  guarded.relay.receive(guarded.ready);
  guarded.relay.receive({ ...guarded.legacy(), source: {} });
  guarded.relay.receive({ ...guarded.legacy(), origin: LEGACY_GAME_ORIGIN + ".attacker.example" });
  guarded.relay.receive(guarded.legacy({ ...seat, code: "UVWXYZ" }));
  guarded.relay.receive(guarded.legacy({ ...seat, token: "bad" }));
  guarded.relay.receive(guarded.legacy({ ...seat, playerId: "" }));
  assert.equal(guarded.messages.length, 0);
});

test("a matching managed acknowledgement clears the probe and queued secret once", () => {
  const fixture = relayFixture();
  fixture.relay.receive(fixture.ready);
  fixture.relay.receive(fixture.legacy());
  fixture.relay.receive({ ...fixture.ready, data: { type: "feud:seat-received", code: "UVWXYZ" } });
  assert.equal(fixture.closed(), 0);
  fixture.relay.receive({ ...fixture.ready, data: { type: "feud:seat-received", code: seat.code } });
  assert.equal(fixture.closed(), 1);
  fixture.relay.receive(fixture.ready);
  fixture.relay.receive(fixture.legacy());
  fixture.relay.dispose();
  assert.equal(fixture.messages.length, 1);
  assert.equal(fixture.closed(), 1);
});

test("an empty legacy result or timeout disposes the relay without transferring a seat", () => {
  const empty = relayFixture();
  empty.relay.receive(empty.legacy(null));
  empty.relay.receive(empty.ready);
  assert.equal(empty.closed(), 1);
  assert.equal(empty.messages.length, 0);

  const timedOut = relayFixture();
  timedOut.relay.receive(timedOut.legacy());
  timedOut.relay.dispose();
  timedOut.relay.receive(timedOut.ready);
  assert.equal(timedOut.closed(), 1);
  assert.equal(timedOut.messages.length, 0);
});
