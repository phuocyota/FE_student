import React, { useState } from "react";
import GoldenBellWinnerPopup from "../GoldenBell/GoldenBellWinnerPopup";

export default function GoldenBellArenaCelebration(props) {
  const [soundEnabled, setSoundEnabled] = useState(false);
  return <>
    {!soundEnabled && <button type="button" onClick={() => setSoundEnabled(true)} className="fixed bottom-4 right-4 z-50 rounded-xl border border-yellow-300 bg-yellow-100 px-4 py-2 text-sm font-bold text-yellow-900 shadow-lg">Bật âm thanh cổ vũ</button>}
    <GoldenBellWinnerPopup {...props} />
  </>;
}
