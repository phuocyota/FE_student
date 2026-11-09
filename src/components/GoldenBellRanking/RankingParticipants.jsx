import React, { useState } from "react";
import RankingParticipantRow from "./RankingParticipantRow";

export default function RankingParticipants({ ranking, canManage, onSelect, onDragStudent, disabled, secondResolved, canChooseRanks }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const shown = ranking.filter((student) => {
    const matchesStatus = filter === "all" || (filter === "playing" ? student.status !== "eliminated" : student.status === "eliminated");
    return matchesStatus && [student.name, student.schoolName, student.className].filter(Boolean).join(" ").toLocaleLowerCase("vi").includes(search.trim().toLocaleLowerCase("vi"));
  });

  return (
    <section className="rounded-2xl border border-green-100 bg-white shadow-sm" aria-labelledby="ranking-participants-title">
      <div className="space-y-3 border-b border-gray-100 p-4">
        <h2 id="ranking-participants-title" className="font-bold text-green-900">Thí sinh ({ranking.length})</h2>
        <label className="sr-only" htmlFor="ranking-search">Tìm thí sinh</label>
        <input id="ranking-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên, trường, lớp..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-600" />
        <div className="flex flex-wrap gap-1">
          {[["all", "Tất cả"], ["playing", "Còn trong sân"], ["eliminated", "Đã hạ bảng"]].map(([value, label]) => (
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === value ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-green-50"}`}>{label}</button>
          ))}
        </div>
        {canManage && canChooseRanks && <p className="rounded-lg bg-green-50 px-3 py-2 text-xs leading-5 text-green-800">Kéo thí sinh vào vị trí trên bục hoặc bấm nút chọn hạng. {secondResolved ? "Có thể chọn hạng 3. Bấm Bỏ chọn để điều chỉnh." : "Chọn hạng 2 trước, sau đó chọn hạng 3."}</p>}
      </div>
      <div className="max-h-[640px] space-y-2 overflow-y-auto p-3">
        {!shown.length ? <p className="py-8 text-center text-sm text-gray-500">Không có thí sinh phù hợp.</p> : shown.map((student) => (
          <RankingParticipantRow key={student.id} student={student} canManage={canManage} onSelect={onSelect} onDragStudent={onDragStudent} disabled={disabled} secondResolved={secondResolved} />
        ))}
      </div>
    </section>
  );
}
