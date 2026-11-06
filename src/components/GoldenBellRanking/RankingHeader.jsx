import React from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

export default function RankingHeader({ room, connection, returnTo }) {
  const students = room.students || [];
  const eliminated = students.filter((student) => student.status === "eliminated").length;
  const status = room.status === "FINISHED" ? "Đã kết thúc" : room.status === "EXPIRED" ? "Đã hết hạn" : room.questionNo ? "Đang thi đấu" : "Chờ bắt đầu";
  return <header className="overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm">
    <div className="bg-green-700 p-5 text-white sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="flex items-center gap-2 text-sm font-semibold text-green-100"><Trophy size={18} /> RUNG CHUÔNG VÀNG</p><h1 className="mt-2 text-3xl font-bold">Bảng xếp hạng</h1><p className="mt-2 text-sm text-green-100">Mã phòng <strong className="text-lg tracking-widest text-white">{room.code || room.roomId}</strong> · {status}</p></div>
        <div className="flex flex-wrap gap-2"><Link to={returnTo} className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25"><ArrowLeft size={16} /> Về sân chơi</Link><Link to="/" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-green-800">Trang chủ</Link></div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
      {[["Tổng thí sinh", students.length], ["Còn trong sân", students.length - eliminated], ["Đã hạ bảng", eliminated], ["Câu hiện tại", room.questionNo || 0]].map(([label, value]) => <div key={label} className="rounded-xl bg-green-50 p-4"><p className="text-xs font-medium text-gray-600">{label}</p><p className="mt-1 text-2xl font-bold text-green-800">{value}</p></div>)}
    </div>
    <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 px-5 py-4 text-sm text-gray-600">
      <p>Đề thi: <strong className="text-gray-800">{room.questionBankName || room.questionBank?.name || room.examSetName || "Chưa có thông tin"}</strong></p>
      {(room.teacherName || room.teacher?.name) && <p>Giáo viên: <strong>{room.teacherName || room.teacher.name}</strong></p>}
      {room.questionDurationSeconds && <p>Thời gian mỗi câu: <strong>{room.questionDurationSeconds} giây</strong></p>}
      <p className="ml-auto font-medium text-green-700">{connection === "connected" ? "Đang cập nhật trực tiếp" : connection === "connecting" ? "Đang kết nối phòng" : "Mất kết nối · dữ liệu đã lưu"}</p>
    </div>
  </header>;
}
