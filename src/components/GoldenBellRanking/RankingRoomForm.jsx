import React, { useState } from "react";

export default function RankingRoomForm({ onSelectRoom }) {
  const [code, setCode] = useState("");
  const [demo, setDemo] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (/^\d{6}$/.test(code)) onSelectRoom({ room: code, ...(demo ? { demo: "1" } : {}) });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-green-100 bg-white p-7 shadow-sm">
        <h1 className="text-2xl font-bold text-green-800">Xếp hạng sân chơi</h1>
        <label htmlFor="ranking-room-code" className="block text-sm font-medium">Mã phòng 6 chữ số</label>
        <input
          id="ranking-room-code"
          required
          pattern="\d{6}"
          inputMode="numeric"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          className="w-full rounded-xl border border-green-200 px-4 py-3 text-xl tracking-widest"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={demo} onChange={(event) => setDemo(event.target.checked)} />
          Phòng demo trên trình duyệt
        </label>
        <button className="w-full rounded-xl bg-green-700 px-4 py-3 font-semibold text-white">Xem xếp hạng</button>
      </form>
    </div>
  );
}
