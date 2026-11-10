import test from "node:test";
import assert from "node:assert/strict";
import { completeGoldenBellWinnerRoom } from "../src/api/goldenBellCompletion.js";
import { getPodiumEditSecondsRemaining, updatePodiumSelection } from "../src/utils/goldenBellRanking.js";

const winnerRoom = () => ({ roomId: "460262", status: "RUNNING", questionNo: 1, students: [
  { id: "winner", status: "passed", lastQuestionNo: 1 },
  { id: "out", status: "eliminated", lastQuestionNo: 1 },
] });

test("the displayed winner automatically ends the room and unlocks podium editing", async () => {
  const room = winnerRoom();
  const finished = { ...room, status: "FINISHED", endedAt: new Date().toISOString() };
  const socket = { connected: true, timeout(ms) { assert.equal(ms, 8000); return this; }, emit(event, payload, ack) {
    assert.equal(event, "golden-bell:end-room");
    assert.deepEqual(payload, { roomId: "460262" });
    ack(null, { ok: true, room: finished });
  } };
  const result = await completeGoldenBellWinnerRoom(socket, room);
  assert.equal(result, finished);
  assert.ok(getPodiumEditSecondsRemaining(result) > 0);
  assert.equal(updatePodiumSelection(result, 1, "out").podiumSelections[1], "out");
  assert.equal(getPodiumEditSecondsRemaining(result, Date.parse(result.endedAt) + 60000), 0);
});

test("finished rooms keep their original end time and do not restart the editing window", async () => {
  const room = { ...winnerRoom(), status: "FINISHED", endedAt: "2020-01-01T00:00:00Z" };
  assert.equal(await completeGoldenBellWinnerRoom(null, room), room);
  assert.equal(getPodiumEditSecondsRemaining(room), 0);
});

test("a match without a winner is not ended prematurely", async () => {
  const room = winnerRoom(); room.students[0].status = "active";
  assert.equal(await completeGoldenBellWinnerRoom(null, room), room);
});

test("disconnection and failed confirmations never pretend the match is finished", async () => {
  await assert.rejects(completeGoldenBellWinnerRoom(null, winnerRoom()), /kết nối/);
  for (const response of [{ ok: false }, { ok: true, room: winnerRoom() }]) {
    const socket = { connected: true, timeout() { return this; }, emit(_event, _payload, ack) { ack(null, response); } };
    await assert.rejects(completeGoldenBellWinnerRoom(socket, winnerRoom()));
  }
});
