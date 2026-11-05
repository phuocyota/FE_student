import test from "node:test";
import assert from "node:assert/strict";
import { canSelectPodiumRank, getGoldenBellRanking, getRankingSelectionView, updatePodiumSelection, withEliminationHistory } from "../src/utils/goldenBellRanking.js";

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
  questionNo: 2,
  students: [
    { id: "winner", name: "Winner", status: "passed", lastQuestionNo: 2 },
    eliminated("a", 1), eliminated("b", 1), eliminated("c", 1),
  ],
});

test("teacher resolves missing second and third place without duplicates", () => {
  const second = updatePodiumSelection(tiedRoom(), 2, "a");
  const third = updatePodiumSelection(second, 3, "b");
  assert.deepEqual(ranks(third), { winner: 1, a: 2, b: 3, c: null });
  assert.equal(getGoldenBellRanking(third).find((student) => student.id === "a").isTeacherSelected, true);
});

test("teacher must resolve second place before selecting third", () => {
  assert.throws(() => updatePodiumSelection(tiedRoom(), 3, "b"), /hạng 2/);
});

test("manual selection cannot change the winner or reuse a contestant", () => {
  assert.throws(() => updatePodiumSelection(tiedRoom(), 1, "a"));
  assert.throws(() => updatePodiumSelection(tiedRoom(), 2, "winner"));
  const room = updatePodiumSelection(tiedRoom(), 2, "a");
  assert.throws(() => updatePodiumSelection(room, 3, "a"));
});

test("unique automatic places stay locked and selections wait until results", () => {
  const room = { questionNo: 2, students: [{ id: "winner", status: "passed", lastQuestionNo: 2 }, eliminated("second", 2), eliminated("third", 1)] };
  assert.equal(canSelectPodiumRank(room, 2), false);
  assert.equal(canSelectPodiumRank(room, 3), false);
  assert.throws(() => updatePodiumSelection(room, 2, "third"));
  const pending = tiedRoom();
  pending.students[0].status = "active";
  assert.equal(canSelectPodiumRank(pending, 2), false);
});

test("clearing second place also clears the subsequent third-place selection", () => {
  const chosen = updatePodiumSelection(updatePodiumSelection(tiedRoom(), 2, "a"), 3, "b");
  const cleared = updatePodiumSelection(chosen, 2, "");
  assert.deepEqual(cleared.podiumSelections, {});
});

test("a room reset clears previous teacher selections", () => {
  const chosen = updatePodiumSelection(tiedRoom(), 2, "a");
  const reset = withEliminationHistory(chosen, { ...chosen, questionNo: 0, students: chosen.students.map((student) => ({ ...student, status: "active" })) });
  assert.deepEqual(reset.podiumSelections, {});
  assert.equal(getGoldenBellRanking(reset).every((student) => student.rank === null), true);
});

test("only first place is displayed when runners-up cannot be ordered", () => {
  const room = tiedRoom();
  assert.deepEqual(ranks(room), { winner: 1, a: null, b: null, c: null });
  assert.equal(canSelectPodiumRank(room, 2), true);
  assert.equal(canSelectPodiumRank(room, 3), true);
  assert.equal(getGoldenBellRanking(room)[0].id, "winner");
});

test("third place waits for an explicit teacher choice after second place is selected", () => {
  const room = tiedRoom();
  room.students = room.students.filter((student) => student.id !== "c");
  const second = updatePodiumSelection(room, 2, "a");
  assert.deepEqual(ranks(second), { winner: 1, a: 2, b: null });
  assert.deepEqual(ranks(updatePodiumSelection(second, 3, "b")), { winner: 1, a: 2, b: 3 });
});

test("one correct and two wrong answers in the same question leaves both runners-up for the teacher", () => {
  const room = {
    questionNo: 1,
    students: [
      { id: "winner", status: "passed", lastQuestionNo: 1 },
      eliminated("firstWrong", 1, "2026-11-05T01:00:00Z"),
      eliminated("secondWrong", 1, "2026-11-05T01:00:10Z"),
    ],
  };
  assert.deepEqual(ranks(room), { winner: 1, firstWrong: null, secondWrong: null });
  assert.equal(canSelectPodiumRank(room, 2), true);
  assert.equal(canSelectPodiumRank(room, 3), true);
  const selected = updatePodiumSelection(updatePodiumSelection(room, 2, "firstWrong"), 3, "secondWrong");
  assert.deepEqual(ranks(selected), { winner: 1, firstWrong: 2, secondWrong: 3 });
  const reversed = updatePodiumSelection(updatePodiumSelection(room, 2, "secondWrong"), 3, "firstWrong");
  assert.deepEqual(ranks(reversed), { winner: 1, firstWrong: 3, secondWrong: 2 });
});

test("inline selection keeps roster order stable while podium places update", () => {
  const room = tiedRoom();
  const before = getRankingSelectionView(room);
  const selected = updatePodiumSelection(room, 2, "c");
  const after = getRankingSelectionView(selected);
  assert.deepEqual(after.participants.map((student) => student.id), before.participants.map((student) => student.id));
  assert.equal(after.participants.find((student) => student.id === "c").rank, 2);
  assert.equal(after.participants.find((student) => student.id === "winner").canChooseSecond, false);
  assert.equal(after.participants.find((student) => student.id === "c").canChooseThird, false);
  assert.equal(after.participants.find((student) => student.id === "a").canChooseThird, true);
  assert.equal(after.secondResolved, true);
});
