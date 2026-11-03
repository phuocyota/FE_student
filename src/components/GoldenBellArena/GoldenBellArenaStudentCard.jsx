import React from "react";
import { Trophy } from "lucide-react";

const seatColors = [
  "bg-rose-500", "bg-pink-500", "bg-blue-500", "bg-violet-500", "bg-emerald-500",
  "bg-amber-400", "bg-indigo-500", "bg-teal-400", "bg-orange-500", "bg-fuchsia-500",
];

export default function GoldenBellArenaStudentCard({ student, index, isWinner }) {
  const isEliminated = student.status === "eliminated";
  const isPassed = student.status === "passed";

  return (
    <div className={`rounded-lg border px-3 py-3 text-center ${
      isWinner ? "border-yellow-400 bg-gradient-to-b from-yellow-50 to-amber-100 shadow-sm"
        : isEliminated ? "border-gray-200 bg-gray-100 opacity-50"
          : isPassed ? "border-green-400 bg-green-50" : "border-gray-200 bg-white"
    }`}>
      {isWinner ? (
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-200">
          <Trophy role="img" aria-label="Cúp chiến thắng" size={30} strokeWidth={1.8} className="fill-yellow-400 text-amber-700 drop-shadow-sm" />
        </div>
      ) : (
        <div className={`mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white ${seatColors[index % seatColors.length]}`}>
          {index + 1}
        </div>
      )}
      <div title={student.name} className={`truncate text-xs text-gray-900 ${isWinner ? "font-bold" : "font-normal"}`}>
        {student.name}
      </div>
      <div className={`mt-1 text-[10px] font-bold uppercase ${isWinner ? "text-amber-800" : "text-gray-500"}`}>
        {isWinner ? "Chiến thắng" : isEliminated ? "Hạ bảng" : "Đang đấu"}
      </div>
    </div>
  );
}
