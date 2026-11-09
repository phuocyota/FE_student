import test from "node:test";
import assert from "node:assert/strict";
import { reviveGoldenBellStudentOnServer } from "../src/api/goldenBell.js";

const room = { roomId: "123456", questionNo: 2 };
const confirmed = { ...room, students: [{ id: "out", status: "active", resumeFromQuestionNo: 3 }] };
const socket = (reply) => ({ connected: true, timeout(ms) { this.ms = ms; return this; }, emit(event, payload, ack) {
  assert.equal(event, "golden-bell:revive-student");
  assert.deepEqual(payload, { roomId: "123456", studentId: "out" });
  reply(ack);
} });

test("sends only identifiers and resolves the authoritative acknowledgement", async () => {
  const connection = socket((ack) => ack(null, { ok: true, room: confirmed }));
  assert.equal(await reviveGoldenBellStudentOnServer(connection, room, "out"), confirmed);
  assert.equal(connection.ms, 8000);
});
test("server rejection and timeout report failure", async () => {
  await assert.rejects(reviveGoldenBellStudentOnServer(socket((ack) => ack(null, { ok: false, message: "Room has ended" })), room, "out"), /Phòng đã kết thúc/);
  await assert.rejects(reviveGoldenBellStudentOnServer(socket((ack) => ack(new Error("timeout"))), room, "out"), /xác nhận/);
});
test("does not accept an eliminated or same-question acknowledgement", async () => {
  for (const student of [{ id: "out", status: "eliminated" }, { id: "out", status: "active", resumeFromQuestionNo: 2 }]) {
    await assert.rejects(reviveGoldenBellStudentOnServer(socket((ack) => ack(null, { ok: true, room: { ...room, students: [student] } })), room, "out"));
  }
});
test("disconnected sockets fail before sending", async () => {
  await assert.rejects(reviveGoldenBellStudentOnServer({ connected: false }, room, "out"), /kết nối/);
});
