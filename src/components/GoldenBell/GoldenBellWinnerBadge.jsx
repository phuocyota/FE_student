import React from "react";
import { Trophy } from "lucide-react";

export default function GoldenBellWinnerBadge({ iconOnly = false }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-yellow-100 text-xs font-bold text-amber-800 ${iconOnly ? "h-8 w-8" : "px-3 py-1.5"}`}>
      <Trophy role="img" aria-label="Cúp chiến thắng" size={iconOnly ? 23 : 20} strokeWidth={1.8} className="shrink-0 fill-yellow-400 text-amber-700" />
      {!iconOnly && "Chiến thắng"}
    </span>
  );
}
