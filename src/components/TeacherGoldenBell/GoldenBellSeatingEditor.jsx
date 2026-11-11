import React, { useEffect, useRef, useState } from "react";
import StudentAvatar from "../GoldenBell/StudentAvatar";
import SeatingColumnSelect from "./SeatingColumnSelect";
import { normalizeSeating, orderSeatedStudents, readSeating, seatingKey } from "../../utils/goldenBellSeating";

export default function GoldenBellSeatingEditor({ roomId, students, token, onClose }) {
  const [seating, setSeating] = useState(() => readSeating(roomId));
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");
  const dialogRef = useRef(null);
  const ordered = orderSeatedStudents(students, seating);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  const selectSeat = (studentId) => {
    const id = String(studentId);
    if (selectedId === null) { setSelectedId(id); return; }
    const ids = ordered.map((student) => String(student.id));
    const from = ids.indexOf(selectedId);
    const to = ids.indexOf(id);
    if (from >= 0 && to >= 0) {
      [ids[from], ids[to]] = [ids[to], ids[from]];
      setSeating((previous) => ({ ...previous, studentIds: ids }));
    }
    setSelectedId(null);
  };

  const save = () => {
    try {
      const value = normalizeSeating({ ...seating, studentIds: ordered.map((student) => student.id) });
      localStorage.setItem(seatingKey(roomId), JSON.stringify(value));
      onClose();
    } catch { setError("Không lưu được sơ đồ. Vui lòng kiểm tra dung lượng hoặc quyền lưu trữ của trình duyệt."); }
  };

  return (
    <dialog ref={dialogRef} onCancel={onClose} aria-labelledby="seating-title" className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-xl bg-white p-5 text-gray-900 shadow-xl backdrop:bg-black/40">
      <h2 id="seating-title" className="text-xl font-bold">Sơ đồ chỗ ngồi</h2>
      <p className="mt-2 text-sm text-gray-600">Bấm hai thí sinh để đổi chỗ. Vị trí được đọc từ trái sang phải, từ trên xuống dưới. Thí sinh mới sẽ được thêm cuối sơ đồ.</p>
      <p className="mt-2 text-sm text-amber-700">Lưu trên trình duyệt này và áp dụng cho tab sân thi đấu cùng trình duyệt.</p>
      <div className="my-4 flex items-center gap-3 text-sm font-semibold">
        <span>Số cột</span>
        <SeatingColumnSelect value={seating.columns} onChange={(columns) => setSeating((previous) => ({ ...previous, columns }))} />
      </div>
      <div className="overflow-x-auto">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${seating.columns}, minmax(80px, 1fr))` }}>
          {ordered.map((student, index) => (
            <button key={student.id} type="button" aria-pressed={selectedId === String(student.id)} onClick={() => selectSeat(student.id)} className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-sm ${selectedId === String(student.id) ? "border-green-600 bg-green-50 ring-2 ring-green-400" : "border-gray-200 hover:bg-gray-50"}`}>
              <span className="text-xs text-gray-500">Ghế {index + 1}</span>
              <StudentAvatar student={student} token={token} />
              <span className="w-full break-words">{student.name || student.fullName || "Thí sinh"}</span>
            </button>
          ))}
        </div>
      </div>
      {!students.length && <p className="py-8 text-center text-gray-500">Chưa có thí sinh tham gia. Bạn vẫn có thể lưu số cột.</p>}
      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={() => { setSeating(normalizeSeating(null)); setSelectedId(null); }} className="rounded-lg border px-4 py-2 text-sm">Đặt lại thứ tự</button>
        <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Hủy</button>
        <button type="button" onClick={save} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white">Lưu sơ đồ</button>
      </div>
    </dialog>
  );
}
