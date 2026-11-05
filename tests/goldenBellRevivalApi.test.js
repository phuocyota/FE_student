import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { reviveGoldenBellStudentOnServer } from "../src/api/goldenBell.js";

const room = () => ({ roomId: "209998", status: "RUNNING", questionNo: 1, questionEndedAt: "2026-11-05T07:48:34Z", students: [{ id: "horse", status: "eliminated", lastQuestionNo: 1, eliminatedReason: "timeout", revivalCount: 2 }] });

class FakeSocket extends EventEmitter {
  connected = true;
  constructor(onSync) { super(); this.onSync = onSync; }
  emit(event, payload) {
    if (event === "golden-bell:sync") { this.payload = payload; this.onSync?.(payload.room, this); return true; }
    return super.emit(event, payload);
  }
  publish(state) { super.emit("golden-bell:room-state", state); }
}

test("expired-question revival sends active status and handled round, then waits for server confirmation", async () => {
  const socket = new FakeSocket();
  const pending = reviveGoldenBellStudentOnServer(socket, room(), "horse");
  const sent = socket.payload.room.students[0];
  assert.equal(sent.status, "active");
  assert.equal(sent.eliminatedReason, null);
  assert.equal(sent.lastQuestionNo, 1);
  assert.equal(sent.resumeFromQuestionNo, 2);
  const confirmed = socket.payload.room;
  socket.publish(confirmed);
  assert.equal(await pending, confirmed);
  assert.equal(socket.listenerCount("golden-bell:room-state"), 0);
});

test("does not claim success when the server returns eliminated/timeout after revival", async () => {
  const socket = new FakeSocket((next, server) => server.publish({ ...next, students: next.students.map((student) => ({ ...student, status: "eliminated", eliminatedReason: "timeout" })) }));
  await assert.rejects(reviveGoldenBellStudentOnServer(socket, room(), "horse"), /backend/);
  assert.equal(socket.listenerCount("golden-bell:room-state"), 0);
});

test("stale elimination snapshots cannot confirm or reject a new revival", async () => {
  const socket = new FakeSocket();
  const pending = reviveGoldenBellStudentOnServer(socket, room(), "horse");
  socket.publish(room());
  socket.publish(socket.payload.room);
  assert.equal((await pending).students[0].status, "active");
});

test("missing confirmation and disconnected sockets report failure", async () => {
  const socket = new FakeSocket();
  await assert.rejects(reviveGoldenBellStudentOnServer(socket, room(), "horse", { timeoutMs: 5 }), /xác nhận/);
  socket.connected = false;
  await assert.rejects(reviveGoldenBellStudentOnServer(socket, room(), "horse"), /kết nối/);
});
