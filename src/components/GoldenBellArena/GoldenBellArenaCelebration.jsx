import React, { useState } from "react";
import GoldenBellWinnerPopup from "../GoldenBell/GoldenBellWinnerPopup";

export default function GoldenBellArenaCelebration(props) {
  const [soundEnabled, setSoundEnabled] = useState(false);
  return <>
    {!soundEnabled && <button type="button" onClick={() => setSoundEnabled(true)} className="rounded-xl border border-yellow-300 bg-yellow-100 px-3 py-2 text-xs font-bold text-yellow-900 shadow-sm lg:absolute lg:right-0 lg:top-0">Bật âm thanh cổ vũ</button>}
    <GoldenBellWinnerPopup {...props} />
  </>;
}
