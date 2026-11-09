import React, { memo } from "react";
import StudentAvatar from "../GoldenBell/StudentAvatar";

function RankingParticipantRow({ student, canManage, disabled, onSelect, onDragStudent }) {
  const canDrag = canManage && !disabled;

  return (
    <article data-student-id={student.id} draggable={canDrag} title={canDrag ? "Kéo thí sinh vào hạng 1, 2 hoặc 3 trên bục" : undefined}
      onDragStart={(event) => {
        if (!canDrag || event.target.closest("button")) { event.preventDefault(); return; }
        event.dataTransfer.setData("application/x-golden-bell-student", student.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStudent(student.id);
      }}
      onDragEnd={() => onDragStudent(null)}
      className={`rounded-xl border p-2.5 transition-colors duration-150 ${canDrag ? "cursor-grab active:cursor-grabbing" : ""} ${student.isWinner ? "border-yellow-300 bg-yellow-50" : student.isTeacherSelected ? "border-green-300 bg-green-50" : "border-gray-100"}`}>
      <div className="flex items-center gap-2">
        <span className={`w-6 shrink-0 text-center text-xs font-bold ${student.rank === 1 ? "text-amber-600" : "text-green-800"}`} aria-label={student.rank ? `Hạng ${student.rank}` : "Chưa xếp hạng"}>{student.rank ? `#${student.rank}` : "—"}</span>
        <StudentAvatar student={student} className="h-9 w-9" />
        <div className="min-w-0 flex-1">
          <h3 title={student.name} className="truncate text-sm font-semibold text-gray-900">{student.name || student.fullName || "Thí sinh"}</h3>
          <p title={student.schoolName} className="mt-0.5 truncate text-xs text-gray-500">{[student.className, student.schoolName].filter(Boolean).join(" · ") || "Chưa có trường, lớp"}</p>
          <p className="mt-1 text-[11px] text-gray-500">Đúng {student.correctCount || 0} · Sai {student.wrongCount || 0}{student.isTeacherSelected ? " · GV chọn" : ""}</p>
        </div>
        <span className={`shrink-0 text-[10px] font-semibold ${student.isWinner ? "text-amber-700" : student.status === "eliminated" ? "text-red-600" : "text-green-700"}`}>{student.isWinner ? "Thắng" : student.status === "eliminated" ? "Hạ bảng" : "Đang thi"}</span>
      </div>
      {canManage && (
        <div className="mt-2 flex flex-wrap justify-end gap-1 border-t border-green-100/70 pt-2">
          {[1, 2, 3].map((rank) => {
            const selected = student.isTeacherSelected && student.rank === rank;
            return <button key={rank} type="button" disabled={disabled} aria-label={`${selected ? "Bỏ" : "Chọn"} hạng ${rank} cho ${student.name}`} aria-pressed={selected} onClick={() => onSelect(rank, selected ? "" : student.id)} className={`rounded-lg px-2 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${selected ? "bg-green-700 text-white hover:bg-green-800" : "bg-green-100 text-green-800 hover:bg-green-200"}`}>{selected ? `✓ Hạng ${rank} · Bỏ` : `Hạng ${rank}`}</button>;
          })}
        </div>
      )}
    </article>
  );
}

const displayedFields = ["id", "name", "fullName", "avatar", "photo", "className", "schoolName", "status", "rank", "isWinner", "correctCount", "wrongCount", "isTeacherSelected", "canChooseSecond", "canChooseThird"];

export default memo(RankingParticipantRow, (previous, next) =>
  previous.canManage === next.canManage && previous.disabled === next.disabled &&
  previous.onSelect === next.onSelect && previous.onDragStudent === next.onDragStudent &&
  displayedFields.every((field) => previous.student[field] === next.student[field])
);
