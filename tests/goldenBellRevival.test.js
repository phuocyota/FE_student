import test from "node:test";
import assert from "node:assert/strict";
import { reviveGoldenBellStudent } from "../src/utils/goldenBellRevival.js";
import { getGoldenBellWinner } from "../src/utils/goldenBellWinner.js";

const createRoom = () => ({
  questionNo: 2,
  status: "ACTIVE",
  podiumSelections: { 2: "out" },
  students: [
    { id: "winner", name: "Winner", status: "passed", lastQuestionNo: 2 },
    { id: "out", name: "Out", status: "eliminated", lastQuestionNo: 2, correctCount: 1, wrongCount: 1, eliminatedAt: "2026-11-05T01:00:00Z", eliminatedQuestionNo: 2, eliminatedReason: "wrong-answer" },
  ],
});

test("revival restores eligibility while retaining scores and the other contestants", () => {
  const room = createRoom();
  const next = reviveGoldenBellStudent(room, "out");
  const student = next.students[1];
  assert.equal(student.status, "active");
  assert.equal(student.lastQuestionNo, 0);
  assert.equal(student.correctCount, 1);
  assert.equal(student.wrongCount, 1);
  assert.equal(student.eliminatedAt, null);
  assert.equal(student.eliminatedQuestionNo, null);
  assert.equal(student.eliminatedReason, null);
  assert.equal(student.revivalCount, 1);
  assert.ok(student.revivedAt);
  assert.equal(next.students[0], room.students[0]);
  assert.equal(room.students[1].status, "eliminated");
});

test("revival clears the previous podium and reopens competition without ending the room", () => {
  const room = createRoom();
  assert.equal(getGoldenBellWinner(room).id, "winner");
  const next = reviveGoldenBellStudent(room, "out");
  assert.equal(getGoldenBellWinner(next), null);
  assert.deepEqual(next.podiumSelections, {});
  assert.equal(next.status, "ACTIVE");
});

test("rejects revival for closed rooms and contestants who are not eliminated", () => {
  for (const status of ["FINISHED", "EXPIRED"]) assert.throws(() => reviveGoldenBellStudent({ ...createRoom(), status }, "out"));
  assert.throws(() => reviveGoldenBellStudent(createRoom(), "winner"));
  assert.throws(() => reviveGoldenBellStudent(createRoom(), "missing"));
});

test("each additional revival has a new revision and does not reopen expired questions", () => {
  const room = { ...createRoom(), questionEndedAt: "2026-11-05T01:01:00Z" };
  room.students[1].revivalCount = 2;
  const next = reviveGoldenBellStudent(room, "out");
  assert.equal(next.students[1].revivalCount, 3);
  assert.equal(next.questionEndedAt, room.questionEndedAt);
  assert.equal(next.students[1].lastQuestionNo, room.questionNo);
  assert.equal(next.students[1].resumeFromQuestionNo, room.questionNo + 1);
});

test("elapsed timer also makes revival wait for the next question without an ended flag", () => {
  const room = { ...createRoom(), questionStartedAt: "2020-01-01T00:00:00Z", questionDurationSeconds: 15 };
  const next = reviveGoldenBellStudent(room, "out");
  assert.equal(next.students[1].status, "active");
  assert.equal(next.students[1].lastQuestionNo, 2);
  assert.equal(next.students[1].resumeFromQuestionNo, 3);
});
