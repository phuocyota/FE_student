import test from "node:test";
import assert from "node:assert/strict";
import { getGoldenBellWinner } from "../src/utils/goldenBellWinner.js";

const room = (students, overrides = {}) => ({ questionNo: 2, students, ...overrides });
const eliminated = { id: "first", status: "eliminated", lastQuestionNo: 2 };

test("waits for the last contestant's answer after the other contestant fails", () => {
  assert.equal(getGoldenBellWinner(room([eliminated, { id: "second", status: "active" }])), null);
});

test("declares a winner only after the remaining contestant passes this round", () => {
  const winner = { id: "second", status: "passed", lastQuestionNo: 2 };
  assert.equal(getGoldenBellWinner(room([eliminated, winner])), winner);
});

test("also recognizes the winner when the correct answer arrives before the wrong answer", () => {
  const winner = { id: "first", status: "passed", lastQuestionNo: 2 };
  const pending = { id: "second", status: "active" };
  assert.equal(getGoldenBellWinner(room([winner, pending])), null);
  assert.equal(getGoldenBellWinner(room([winner, { ...pending, status: "eliminated" }])), winner);
});

test("does not declare a winner when both contestants fail", () => {
  assert.equal(getGoldenBellWinner(room([eliminated, { id: "second", status: "eliminated", lastQuestionNo: 2 }])), null);
});

test("a correct answer from a previous round cannot win the current round", () => {
  assert.equal(getGoldenBellWinner(room([eliminated, { id: "second", status: "passed", lastQuestionNo: 1 }])), null);
});

test("keeps waiting while multiple contestants remain", () => {
  assert.equal(getGoldenBellWinner(room([eliminated, { id: "second", status: "passed", lastQuestionNo: 2 }, { id: "third", status: "active" }])), null);
});

test("does not award a win before play, to a sole entrant, or in an expired room", () => {
  const winner = { id: "second", status: "passed", lastQuestionNo: 2 };
  assert.equal(getGoldenBellWinner(room([eliminated, winner], { questionNo: 0 })), null);
  assert.equal(getGoldenBellWinner(room([winner])), null);
  assert.equal(getGoldenBellWinner(room([eliminated, winner], { status: "EXPIRED" })), null);
});
