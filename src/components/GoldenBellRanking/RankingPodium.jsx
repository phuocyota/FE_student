import React from "react";
import { UserRound } from "lucide-react";
import podium from "../../assets/ranking-podium-transparent.png";
import StudentAvatar from "../GoldenBell/StudentAvatar";

const positions = [
  { rank: 2, left: "22%", top: "52%" },
  { rank: 1, left: "49%", top: "34.5%" },
  { rank: 3, left: "75%", top: "61%" },
];

export default function RankingPodium({ ranking, draggedStudent, canManage, onSelect, onDragStudent }) {
  const allowDrop = (event) => {
    if (!canManage || !draggedStudent) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };
  const dropIntoRank = (event, rank) => {
    event.preventDefault();
    const studentId = event.dataTransfer.getData("application/x-golden-bell-student");
    if (canManage && draggedStudent && studentId === draggedStudent.id) onSelect(rank, studentId);
    onDragStudent?.(null);
  };
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-yellow-100 bg-gradient-to-b from-white to-amber-50/40 p-4 shadow-sm sm:p-6" aria-labelledby="ranking-podium-title">
      <h2 id="ranking-podium-title" className="text-xl font-bold text-green-900">Bục vinh danh</h2>
      <p className="mt-2 text-sm text-gray-500">Giáo viên có thể điều chỉnh hạng 1, 2, 3 trong 1 phút sau khi sàn đấu kết thúc.</p>
      <div className="relative mx-auto mt-24 aspect-[4/3] w-full max-w-2xl [container-type:inline-size]" style={{ backgroundImage: `url(${podium})`, backgroundSize: "100% auto", backgroundPosition: "top center", backgroundRepeat: "no-repeat" }}>
        <p className="sr-only">Bục vàng gồm hạng 2 bên trái, hạng 1 ở giữa và hạng 3 bên phải.</p>
        {canManage && draggedStudent && <div className="absolute inset-x-0 bottom-0 top-[30%] grid grid-cols-3 gap-1">
          {[2, 1, 3].map((rank) => <div key={rank} data-podium-drop-rank={rank} onDragOver={allowDrop} onDrop={(event) => dropIntoRank(event, rank)} className="rounded-xl border-2 border-dashed border-green-500 bg-green-100/20" aria-label={`Thả thí sinh vào hạng ${rank}`} />)}
        </div>}
        {positions.map(({ rank, left, top }) => {
          const students = ranking.filter((student) => student.rank === rank);
          const canDrop = canManage && draggedStudent && [1, 2, 3].includes(rank);
          return (
            <div key={rank} style={{ left, top, transform: "translate(-50%, -100%)" }} data-podium-rank={rank}
              onDragOver={allowDrop}
              onDrop={(event) => dropIntoRank(event, rank)}
              className={`absolute w-[30%] rounded-xl pb-2 text-center transition-colors sm:pb-3 ${canDrop ? "bg-green-100/90 ring-2 ring-green-500 ring-offset-4" : ""}`}>
              <p className={`mb-2 text-[10px] font-bold uppercase tracking-wide sm:text-xs ${rank === 1 ? "text-amber-600" : "text-green-700"}`}>Hạng {rank}</p>
              {canDrop && <p className="mb-2 text-xs font-semibold text-green-800">Thả vào đây</p>}
              {students.length ? (
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {students.map((student) => (
                    <div key={student.id} className="flex flex-col items-center gap-2">
                      <StudentAvatar student={student} className={rank === 1 ? "h-14 w-14 sm:h-20 sm:w-20" : "h-12 w-12 sm:h-16 sm:w-16"} />
                      <p className="w-full break-words font-bold leading-tight text-green-950" style={{ fontSize: "clamp(11px, 2.8cqw, 17px)" }}>{student.name || student.fullName}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-green-200 bg-white/80 sm:h-16 sm:w-16"><UserRound size={24} aria-hidden="true" /></span>
                  <p className="text-[10px] sm:text-xs">{rank !== 1 && ranking.some((student) => student.isWinner) ? "Chờ giáo viên chọn" : "Chưa xác định"}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
