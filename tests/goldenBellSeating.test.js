import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSeating, orderSeatedStudents, readSeating, seatingKey } from "../src/utils/goldenBellSeating.js";

test("saved seats survive room snapshot reordering and append new contestants", () => {
  const seating = { columns: 3, studentIds: [2, 1, 99] };
  const students = [{ id: 1 }, { id: 3 }, { id: 2, status: "eliminated" }];
  assert.deepEqual(orderSeatedStudents(students, seating).map((student) => student.id), [2, 1, 3]);
  assert.deepEqual(students.map((student) => student.id), [1, 3, 2]);
});

test("storage is room scoped and corrupt or blocked storage uses safe defaults", () => {
  const data = new Map([[seatingKey("A"), JSON.stringify({ columns: 4, studentIds: ["b", "a"] })]]);
  const storage = { getItem: (key) => data.get(key) ?? null };
  assert.deepEqual(readSeating("A", storage), { columns: 4, studentIds: ["b", "a"] });
  assert.deepEqual(readSeating("B", storage), { columns: 2, studentIds: [] });
  assert.deepEqual(readSeating("A", { getItem: () => { throw new Error("blocked"); } }), normalizeSeating(null));
  data.set(seatingKey("A"), "invalid json");
  assert.deepEqual(readSeating("A", storage), normalizeSeating(null));
});

test("invalid layouts cannot duplicate contestants or produce invalid column counts", () => {
  assert.deepEqual(normalizeSeating({ columns: 100, studentIds: [1, "1", null, {}, "b"] }), { columns: 8, studentIds: ["1", "b"] });
  assert.equal(normalizeSeating({ columns: -3 }).columns, 1);
  assert.equal(normalizeSeating({ columns: "bad" }).columns, 2);
});
