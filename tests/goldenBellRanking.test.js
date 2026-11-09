import test from "node:test";
import assert from "node:assert/strict";
import { canSelectPodiumRank, getGoldenBellRanking, getRankingSelectionView, updatePodiumSelection, withEliminationHistory, getPodiumEditSecondsRemaining } from "../src/utils/goldenBellRanking.js";

const eliminated = (id, round, time) => ({ id, name: id, status: "eliminated", lastQuestionNo: round, eliminatedAt: time });
const ranks = (room) => Object.fromEntries(getGoldenBellRanking(room).map((student) => [student.id, student.rank]));

test("ranks the last eliminated contestants second and third, leaving first unresolved", () => {
  const room = { questionNo: 4, students: [eliminated("early", 1), eliminated("third", 2), eliminated("second", 4), { id: "pending", status: "active" }] };
  assert.deepEqual(ranks(room), { early: 4, third: 3, second: 2, pending: null });
  room.students[3] = { id: "winner", status: "passed", lastQuestionNo: 4 };
  assert.deepEqual(ranks(room), { early: 4, third: 3, second: 2, winner: 1 });
});

test("submission time does not break ties for contestants failing the same question", () => {
  assert.deepEqual(ranks({ questionNo: 2, students: [eliminated("earlier", 2, "2026-11-05T01:00:00Z"), eliminated("later", 2, "2026-11-05T01:00:01Z"), { id: "playing", status: "active" }] }), { earlier: 2, later: 2, playing: null });
});

test("shares ranks when simultaneous exits cannot be distinguished", () => {
  assert.deepEqual(ranks({ questionNo: 2, students: [eliminated("a", 2), eliminated("b", 2), { id: "playing", status: "active" }] }), { a: 2, b: 2, playing: null });
});

test("never gives first place when every contestant fails", () => {
  assert.equal(getGoldenBellRanking({ questionNo: 2, students: [eliminated("a", 2), eliminated("b", 2)] }).some((student) => student.rank === 1), false);
});

test("does not rank active contestants based on answer order or correct count", () => {
  assert.deepEqual(ranks({ questionNo: 2, students: [{ id: "a", status: "passed", lastQuestionNo: 2, correctCount: 10 }, { id: "b", status: "active", correctCount: 0 }] }), { a: null, b: null });
});

test("retains an exit timestamp across snapshots and clears it after rescue/reset", () => {
  const previous = { questionNo: 2, students: [{ id: "a", status: "active", avatar: "photo.jpg" }] };
  const next = withEliminationHistory(previous, { questionNo: 2, students: [eliminated("a", 2)] });
  assert.ok(next.students[0].eliminatedAt);
  assert.equal(next.students[0].avatar, "photo.jpg");
  const repeated = withEliminationHistory(next, { questionNo: 3, students: [eliminated("a", 2)] });
  assert.equal(repeated.students[0].eliminatedAt, next.students[0].eliminatedAt);
  const reset = withEliminationHistory(repeated, { questionNo: 0, students: [{ id: "a", status: "active" }] });
  assert.equal(reset.students[0].eliminatedAt, null);
});

test("does not mutate the room or invent historical exit times", () => {
  const room = { questionNo: 3, students: [eliminated("a", 1), eliminated("b", 2)] };
  const before = JSON.stringify(room);
  getGoldenBellRanking(room);
  assert.equal(JSON.stringify(room), before);
  assert.equal(withEliminationHistory(null, room).students[0].eliminatedAt, null);
});

const tiedRoom = () => ({
  status: "FINISHED",
  endedAt: new Date().toISOString(),
  questionNo: 2,
  students: [
    { id: "winner", name: "Winner", status: "passed", lastQuestionNo: 2 },
    eliminated("a", 1), eliminated("b", 1), eliminated("c", 1),
  ],
});

test("teacher may assign every rank after finishing and override the automatic winner", () => {
  const room = tiedRoom();
  for (const rank of [1, 2, 3]) assert.equal(canSelectPodiumRank(room, rank), true);
  const chosen = updatePodiumSelection(room, 1, "a");
  assert.equal(ranks(chosen).a, 1);
  assert.equal(ranks(chosen).winner, null);
  assert.equal(getGoldenBellRanking(chosen).filter(s => s.isWinner).length, 1);
  assert.equal(getGoldenBellRanking(chosen).find(s => s.id === "a").isWinner, true);
  const pending = { questionNo: 0, status: "WAITING", students: [{id: "active", status: "active"}] };
  assert.throws(() => updatePodiumSelection(pending, 1, "active"));
});

test("editing is allowed only for the first minute after finishing", () => {
  const now = Date.now();
  const room = { ...tiedRoom(), endedAt: new Date(now).toISOString() };
  assert.equal(getPodiumEditSecondsRemaining(room, now), 60);
  assert.equal(getPodiumEditSecondsRemaining(room, now + 59999), 1);
  assert.equal(getPodiumEditSecondsRemaining(room, now + 60000), 0);
  assert.equal(getPodiumEditSecondsRemaining({ ...room, status: "RUNNING" }, now), 0);
  assert.equal(getPodiumEditSecondsRemaining({ ...room, endedAt: null }, now), 0);
  assert.equal(getPodiumEditSecondsRemaining(room, now - 1), 0);
  assert.throws(() => updatePodiumSelection({ ...room, endedAt: new Date(now - 60001).toISOString() }, 1, "a"));
});

test("teacher can select third place first and move a contestant without duplicate slots", () => {
  const third = updatePodiumSelection(tiedRoom(), 3, "a");
  const first = updatePodiumSelection(third, 1, "a");
  assert.equal(first.podiumSelections[3], null);
  assert.equal(ranks(first).a, 1);
  assert.equal(getGoldenBellRanking(first).filter(s => s.rank === 3).length, 0);
});

test("replacing an occupied place removes its previous occupant from the podium", () => {
  const chosen = updatePodiumSelection(updatePodiumSelection(tiedRoom(), 2, "a"), 2, "b");
  assert.equal(ranks(chosen).b, 2);
  assert.equal(ranks(chosen).a, null);
});

test("clearing a rank keeps other choices and does not restore the automatic occupant", () => {
  const chosen = updatePodiumSelection(updatePodiumSelection(tiedRoom(), 2, "a"), 3, "b");
  const cleared = updatePodiumSelection(chosen, 2, "");
  assert.equal(cleared.podiumSelections[2], null);
  assert.equal(cleared.podiumSelections[3], "b");
  assert.equal(ranks(cleared).b, 3);
  assert.equal(ranks(cleared).a, null);
});

test("rejects invalid ranks and unknown contestants without mutating the room", () => {
  const room = tiedRoom(); const original = JSON.stringify(room);
  assert.throws(() => updatePodiumSelection(room, 4, "a"));
  assert.throws(() => updatePodiumSelection(room, 1, "missing"));
  updatePodiumSelection(room, 1, "a");
  assert.equal(JSON.stringify(room), original);
});

test("manual results work in finished rooms and survive a waiting-room update", () => {
  const chosen = updatePodiumSelection({ ...tiedRoom(), status: "FINISHED" }, 1, "c");
  assert.equal(ranks(chosen).c, 1);
  const waiting = { ...chosen, questionNo: 0 };
  assert.equal(ranks(withEliminationHistory(waiting, waiting)).c, 1);
});

test("a room reset clears previous teacher selections", () => {
  const chosen = updatePodiumSelection(tiedRoom(), 1, "a");
  const reset = withEliminationHistory(chosen, { ...chosen, questionNo: 0, students: chosen.students.map(s => ({...s, status: "active"})) });
  assert.deepEqual(reset.podiumSelections, {});
  assert.equal(getGoldenBellRanking(reset).every(s => s.rank === null), true);
});

test("all contestants stay selectable and roster order remains stable", () => {
  const before = getRankingSelectionView(tiedRoom());
  const after = getRankingSelectionView(updatePodiumSelection(tiedRoom(), 1, "c"));
  assert.deepEqual(after.participants.map(s => s.id), before.participants.map(s => s.id));
  assert.equal(after.participants.every(s => s.canChooseFirst && s.canChooseSecond && s.canChooseThird), true);
});
