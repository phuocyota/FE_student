import test from "node:test";
import assert from "node:assert/strict";
import { applyLocalPodium, localPodiumKey, readLocalPodiumRoom, saveLocalPodium } from "../src/utils/goldenBellLocalPodium.js";
import { updatePodiumSelection } from "../src/utils/goldenBellRanking.js";

const createStorage = () => {
  const records = new Map();
  return { getItem: (key) => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) };
};
const room = () => ({ roomId: "123456", status: "FINISHED", endedAt: new Date().toISOString(), questionNo: 2,
  students: [{ id: "a", status: "eliminated" }, { id: "b", status: "active" }] });

test("local result can be read by another tab or restored after reload", () => {
  const storage = createStorage();
  const original = room();
  const next = saveLocalPodium(updatePodiumSelection(original, 1, "a"), storage);
  assert.equal(readLocalPodiumRoom("123456", storage).podiumSelections[1], "a");
  assert.deepEqual(applyLocalPodium(original, storage), next);
  assert.equal(original.podiumSelections, undefined);
});

test("stale server podium values cannot overwrite the local choice", () => {
  const storage = createStorage(); const original = room();
  saveLocalPodium(updatePodiumSelection(original, 1, "b"), storage);
  assert.equal(applyLocalPodium({ ...original, podiumSelections: { 1: "a" } }, storage).podiumSelections[1], "b");
});

test("results do not leak into another room or a different match", () => {
  const storage = createStorage(); const original = room();
  saveLocalPodium(updatePodiumSelection(original, 1, "a"), storage);
  assert.equal(readLocalPodiumRoom("654321", storage), null);
  const differentMatch = { ...original, endedAt: "2020-01-01T00:00:00Z" };
  assert.equal(applyLocalPodium(differentMatch, storage), differentMatch);
  const running = { ...original, status: "RUNNING" };
  assert.equal(applyLocalPodium(running, storage), running);
});

test("editing stops at one minute but the saved result remains visible", () => {
  const storage = createStorage(); const original = room();
  saveLocalPodium(updatePodiumSelection(original, 1, "a"), storage);
  assert.throws(() => saveLocalPodium({ ...original, endedAt: new Date(Date.now() - 60_000).toISOString() }, storage));
  assert.equal(readLocalPodiumRoom("123456", storage).podiumSelections[1], "a");
});

test("damaged storage is ignored and a failed write is reported", () => {
  const storage = createStorage();
  storage.setItem(localPodiumKey("123456"), "invalid-json");
  assert.equal(readLocalPodiumRoom("123456", storage), null);
  assert.throws(() => saveLocalPodium(room(), { setItem() { throw new Error("storage full"); } }), /storage full/);
});
