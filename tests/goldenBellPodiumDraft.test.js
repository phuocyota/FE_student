import test from "node:test";
import assert from "node:assert/strict";
import { readPodiumDraft, writePodiumDraft } from "../src/utils/goldenBellPodiumDraft.js";
import { readLocalPodiumRoom, rememberPodiumResult } from "../src/utils/goldenBellLocalPodium.js";
import { updatePodiumSelection } from "../src/utils/goldenBellRanking.js";
import { submitGoldenBellPodiumResult } from "../src/api/goldenBellPodium.js";

const storage = () => {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
};
const room = () => ({ roomId: "460262", status: "FINISHED", endedAt: new Date().toISOString(), questionNo: 1,
  students: [{ id: "a", status: "passed", lastQuestionNo: 1 }, { id: "b", status: "eliminated", lastQuestionNo: 1 }] });

test("many local edits remain a draft; only submitting sends the final selection", async () => {
  const store = storage(); let calls = 0;
  let draft = room();
  for (const [rank, id] of [[1, "b"], [2, "a"], [3, "a"], [1, "a"], [2, "b"]]) {
    draft = updatePodiumSelection(draft, rank, id);
    writePodiumDraft(draft, false, store);
    assert.equal(readLocalPodiumRoom(draft.roomId, store), null);
    assert.equal(calls, 0);
  }
  const socket = { connected: true, timeout() { return this; }, emit(event, payload, ack) {
    calls++;
    assert.equal(event, "golden-bell:podium-result");
    assert.deepEqual(payload.selections, draft.podiumSelections);
    ack(null, { ok: true, room: draft });
  } };
  const final = await submitGoldenBellPodiumResult(socket, draft);
  rememberPodiumResult(final, store);
  writePodiumDraft(final, true, store);
  assert.equal(calls, 1);
  assert.equal(readLocalPodiumRoom(final.roomId, store).podiumSelections[2], "b");
  assert.equal(readPodiumDraft(final.roomId, store).finalized, true);
});

test("a draft survives reload without changing the already published arena result", () => {
  const store = storage();
  const published = updatePodiumSelection(room(), 1, "a");
  rememberPodiumResult(published, store);
  const draft = updatePodiumSelection(published, 1, "b");
  writePodiumDraft(draft, false, store);
  assert.equal(readPodiumDraft(draft.roomId, store).room.podiumSelections[1], "b");
  assert.equal(readLocalPodiumRoom(draft.roomId, store).podiumSelections[1], "a");
});

test("the final draft can be sent automatically after the editing deadline", async () => {
  const draft = updatePodiumSelection(room(), 1, "b");
  draft.endedAt = new Date(Date.now() - 60001).toISOString();
  const socket = { connected: true, timeout() { return this; }, emit(_event, _payload, ack) { ack(null, { ok: true, room: draft }); } };
  assert.equal(await submitGoldenBellPodiumResult(socket, draft), draft);
});

test("failed submissions leave the draft available to retry", async () => {
  const store = storage(); const draft = updatePodiumSelection(room(), 1, "b");
  writePodiumDraft(draft, false, store);
  const socket = { connected: true, timeout() { return this; }, emit(_event, _payload, ack) { ack(new Error("timeout")); } };
  await assert.rejects(submitGoldenBellPodiumResult(socket, draft));
  assert.equal(readPodiumDraft(draft.roomId, store).finalized, false);
  assert.equal(readLocalPodiumRoom(draft.roomId, store), null);
});

test("offline or mismatched acknowledgements do not confirm a final result", async () => {
  const draft = room();
  await assert.rejects(submitGoldenBellPodiumResult(null, draft));
  const socket = { connected: true, timeout() { return this; }, emit(_event, _payload, ack) { ack(null, { ok: true, room: { ...draft, roomId: "other" } }); } };
  await assert.rejects(submitGoldenBellPodiumResult(socket, draft));
});
