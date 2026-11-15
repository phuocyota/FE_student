import test from "node:test";
import assert from "node:assert/strict";
import {
  GOLDEN_BELL_QUESTION_SECONDS,
  applyGoldenBellAnswer,
  getDisplayedGoldenBellStudents,
  getGoldenBellStudentAnswer,
  isGoldenBellAnswerPending,
  isGoldenBellAnswerRevealed,
  requireGoldenBellAnswerReveal,
  revealGoldenBellAnswer,
} from "../src/utils/goldenBellAnswerReveal.js";
import { getGoldenBellWinner } from "../src/utils/goldenBellWinner.js";

const question = { id: "q2" };
const passed = { id: "a", status: "passed", lastQuestionNo: 2 };
const failedNow = { id: "b", status: "eliminated", lastQuestionNo: 2, eliminatedQuestionNo: 2 };
const failedBefore = { id: "c", status: "eliminated", lastQuestionNo: 1, eliminatedQuestionNo: 1 };
const room = (overrides = {}) => ({ questionNo: 2, currentQuestion: question, answerRevealed: false, students: [passed, failedNow, failedBefore], ...overrides });

test("each question lasts 20 seconds", () => {
  assert.equal(GOLDEN_BELL_QUESTION_SECONDS, 20);
});

test("the answer stays hidden until the teacher reveals it", () => {
  assert.equal(isGoldenBellAnswerPending(room()), true);
  assert.equal(isGoldenBellAnswerRevealed(room()), false);
  const revealed = revealGoldenBellAnswer(room(), "2026-11-15T10:00:00.000Z");
  assert.equal(isGoldenBellAnswerPending(revealed), false);
  assert.equal(isGoldenBellAnswerRevealed(revealed), true);
  assert.equal(revealed.questionEndedAt, "2026-11-15T10:00:00.000Z");
});

test("revealing keeps an earlier end time and needs a question", () => {
  const revealed = revealGoldenBellAnswer(room({ questionEndedAt: "earlier" }), "later");
  assert.equal(revealed.questionEndedAt, "earlier");
  assert.throws(() => revealGoldenBellAnswer(room({ currentQuestion: null })));
});

test("a finished room counts as revealed; a room without the field is never pending", () => {
  assert.equal(isGoldenBellAnswerRevealed(room({ status: "FINISHED" })), true);
  assert.equal(isGoldenBellAnswerPending(room({ answerRevealed: undefined })), false);
});

test("current-question results are masked before the reveal, earlier eliminations are not", () => {
  const [a, b, c] = getDisplayedGoldenBellStudents(room());
  assert.equal(a.status, "active");
  assert.equal(a.hasPendingAnswer, true);
  assert.equal(b.status, "active");
  assert.equal(c.status, "eliminated");
  assert.deepEqual(getDisplayedGoldenBellStudents(room({ answerRevealed: true })).map((s) => s.status), ["passed", "eliminated", "eliminated"]);
});

test("no winner is declared before the reveal", () => {
  const students = [failedNow, passed];
  assert.equal(getGoldenBellWinner(room({ students })), null);
  assert.equal(getGoldenBellWinner(room({ students, answerRevealed: true })), passed);
});

test("changing an answer swaps the counts instead of adding to them", () => {
  const start = { id: "s", status: "active", correctCount: 1, wrongCount: 0 };
  const wrong = applyGoldenBellAnswer(start, { questionNo: 2, answerId: "x", isCorrect: false, now: "t" });
  assert.equal(wrong.status, "eliminated");
  assert.equal(wrong.wrongCount, 1);
  assert.equal(wrong.eliminatedQuestionNo, 2);

  const fixed = applyGoldenBellAnswer(wrong, { questionNo: 2, answerId: "y", isCorrect: true, previousIsCorrect: false });
  assert.equal(fixed.status, "passed");
  assert.equal(fixed.correctCount, 2);
  assert.equal(fixed.wrongCount, 0);
  assert.equal(fixed.eliminatedQuestionNo, null);
  assert.deepEqual(getGoldenBellStudentAnswer(fixed, 2), { answerId: "y", isCorrect: true });
});

test("an answer from another question is not treated as answered", () => {
  assert.equal(getGoldenBellStudentAnswer(failedBefore, 2), null);
  assert.equal(getGoldenBellStudentAnswer({ id: "s", status: "active" }, 2), null);
});

test("the arena waits for the teacher's reveal even when the room has no reveal field", () => {
  const legacy = requireGoldenBellAnswerReveal(room({ answerRevealed: undefined }));
  assert.equal(isGoldenBellAnswerRevealed(legacy), false);
  assert.deepEqual(getDisplayedGoldenBellStudents(legacy).map((s) => s.status), ["active", "active", "eliminated"]);
  assert.equal(getGoldenBellWinner(legacy), null);
  assert.equal(isGoldenBellAnswerRevealed(requireGoldenBellAnswerReveal(room({ answerRevealed: true }))), true);
  assert.equal(isGoldenBellAnswerRevealed(requireGoldenBellAnswerReveal(room({ answerRevealed: undefined, status: "FINISHED" }))), true);
});
