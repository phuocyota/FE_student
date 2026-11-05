import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import StudentAvatar from "../components/GoldenBell/StudentAvatar";
import { demoRoomKey, readDemoRoom } from "../utils/demoRegistration";
import GoldenBellWinnerPopup from "../components/GoldenBell/GoldenBellWinnerPopup";
import { openGoldenBellRanking, podiumSelectionsKey } from "../utils/goldenBellRanking";
import { reviveGoldenBellStudent } from "../utils/goldenBellRevival";

export default function GoldenBellDemoTeacher() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const roomId = /^\d{6}$/.test(params.get("room") || "") ? params.get("room") : "";
  const [code, setCode] = useState(roomId);
  const [room, setRoom] = useState(() => readDemoRoom(roomId));
  const [error, setError] = useState("");

  const reviveStudent = (studentId) => {
    try {
      const nextRoom = reviveGoldenBellStudent(readDemoRoom(roomId), studentId);
      localStorage.setItem(podiumSelectionsKey(roomId, true), "{}");
      localStorage.setItem(demoRoomKey(roomId), JSON.stringify(nextRoom));
      setRoom(nextRoom);
      setError("");
    } catch (revivalError) {
      setError(revivalError.message || "Không thể hồi sinh thí sinh.");
    }
  };

  const endRoom = () => {
    if (!window.confirm(`Kết thúc phòng demo ${roomId}?`)) return;
    try {
      const nextRoom = { ...readDemoRoom(roomId), status: "FINISHED", questionEndedAt: new Date().toISOString() };
      localStorage.setItem(demoRoomKey(roomId), JSON.stringify(nextRoom));
      setRoom(nextRoom);
      setError("");
    } catch {
      setError("Không thể lưu trạng thái kết thúc phòng. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    const update = () => setRoom(readDemoRoom(roomId));
    update();
    const handleStorage = (event) => { if (event.key === demoRoomKey(roomId)) update(); };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [roomId]);

  return <div className="min-h-screen bg-green-50 px-4 py-8">
    <GoldenBellWinnerPopup room={room} roomId={roomId} />
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-2xl bg-green-700 p-6 text-white">
        <h1 className="text-2xl font-bold">Giáo viên · Rung chuông vàng demo</h1>
        <p className="mt-2 text-sm text-green-50">Thông tin và ảnh đồng bộ giữa các tab cùng trình duyệt, cùng địa chỉ website. Chưa kết nối API.</p>
      </header>
      <form onSubmit={(event) => { event.preventDefault(); if (/^\d{6}$/.test(code)) setParams({ room: code }); }} className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-5 shadow-sm">
        <div><label htmlFor="demo-teacher-room" className="mb-2 block text-sm font-semibold">Mã phòng demo</label><input id="demo-teacher-room" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" pattern="\d{6}" required placeholder="Nhập mã 6 chữ số" className="rounded-xl border border-green-200 px-4 py-3 text-xl tracking-widest" /></div>
        <button className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white" type="submit">Xem phòng</button>
      </form>
      {roomId && <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-green-800">Phòng {roomId} · {room.students.length} thí sinh</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => openGoldenBellRanking(navigate, room, `/teacher/demo?room=${roomId}`)} className="rounded-xl border border-green-700 px-4 py-2 font-semibold text-green-700">Xếp hạng</button>
          <button type="button" onClick={endRoom} disabled={room.status === "FINISHED"} className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{room.status === "FINISHED" ? "Phòng đã kết thúc" : "Kết thúc phòng"}</button>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        {!room.students.length ? <p className="py-8 text-center text-gray-500">Chưa có thí sinh. Đăng ký và nhập mã {roomId} ở tab học sinh để tham gia.</p> : <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{room.students.map((student) => <article key={student.id} className="flex items-center gap-4 rounded-xl border border-green-100 p-4">
          <StudentAvatar student={student} className="h-16 w-16" />
          <div className="min-w-0"><h3 className="break-words font-bold text-gray-900">{student.name}</h3><p className="text-sm text-gray-600">Lớp {student.className}</p><p className="break-words text-sm text-gray-600">{student.schoolName}</p><p className="mt-1 text-xs font-semibold text-green-700">{student.status === "eliminated" ? "Đã hạ bảng" : "Đã vào sân"}</p></div>
          <div className="ml-auto space-y-2 text-xs"><p className="text-green-700">Đúng: {student.correctCount || 0}</p><p className="text-red-600">Sai: {student.wrongCount || 0}</p>{student.status === "eliminated" && <button type="button" aria-label={`Hồi sinh ${student.name}`} disabled={room.status === "FINISHED" || room.status === "EXPIRED"} onClick={() => reviveStudent(student.id)} className="rounded-lg border border-green-300 bg-green-50 px-2 py-1.5 font-semibold text-green-700 hover:bg-green-100 disabled:opacity-40">Hồi sinh</button>}</div>
        </article>)}</div>}
      </section>}
      <Link to="/login" className="inline-block font-semibold text-green-700 underline">Mở trang đăng ký học sinh</Link>
    </div>
  </div>;
}
