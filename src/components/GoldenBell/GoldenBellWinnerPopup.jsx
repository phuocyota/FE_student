import React, { useEffect, useRef } from "react";
import { Trophy, X } from "lucide-react";
import { launchFireworks, playApplause, prepareApplause } from "./celebrationEffects";
import { getGoldenBellWinner } from "../../utils/goldenBellWinner";

const GoldenBellWinnerPopup = ({ room, roomId, eligibleStudentId }) => {
  const overlayRef = useRef(null);
  const canvasRef = useRef(null);
  const nameRef = useRef(null);
  const detailsRef = useRef(null);
  const audioRef = useRef(null);
  const celebratedRef = useRef(false);
  const stopRef = useRef(() => {});
  const stopSoundRef = useRef(() => {});
  const visibleRef = useRef(false);

  // Browsers require a teacher interaction before allowing sound playback.
  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioRef.current = new AudioContext();
      void prepareApplause(audioRef.current).catch(() => {});
    }
    const unlockAudio = () => {
      if (!audioRef.current) return;
      const wasSuspended = audioRef.current.state !== "running";
      void audioRef.current.resume().then(() => {
        if (wasSuspended && visibleRef.current) {
          stopSoundRef.current();
          stopSoundRef.current = playApplause(audioRef.current);
        }
      }).catch(() => {});
    };
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      stopRef.current();
      if (audioRef.current) void audioRef.current.close().catch(() => {});
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    celebratedRef.current = false;
    stopRef.current();
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !room.questionNo || room.status === "EXPIRED") {
      celebratedRef.current = false;
      stopRef.current();
      return;
    }

    const winner = getGoldenBellWinner(room);
    if (!winner || (eligibleStudentId !== undefined && winner.id !== eligibleStudentId)) {
      stopRef.current();
      return;
    }
    // A room with just its first participant is not a winning round.
    if (celebratedRef.current) return;

    celebratedRef.current = true;
    nameRef.current.textContent = winner.name || "Thí sinh xuất sắc";
    detailsRef.current.textContent = `Mã phòng: ${roomId} • Câu cuối: ${room.questionNo} • Đúng: ${winner.correctCount || 0} • Sai: ${winner.wrongCount || 0}`;
    overlayRef.current.hidden = false;
    const previousFocus = document.activeElement;
    overlayRef.current.querySelector("button")?.focus();
    visibleRef.current = true;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stopFireworks = reducedMotion ? () => {} : launchFireworks(canvasRef.current);
    stopSoundRef.current = playApplause(audioRef.current);
    const stopEffects = () => {
      stopFireworks();
      stopSoundRef.current();
      stopSoundRef.current = () => {};
      visibleRef.current = false;
    };
    const timer = window.setTimeout(stopEffects, 8000);
    stopRef.current = () => {
      window.clearTimeout(timer);
      stopEffects();
      if (overlayRef.current) overlayRef.current.hidden = true;
      if (previousFocus?.isConnected) previousFocus.focus();
      stopRef.current = () => {};
    };
  }, [room, roomId, eligibleStudentId]);

  return (
    <div ref={overlayRef} hidden>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div className="relative w-full max-w-lg rounded-3xl border-2 border-yellow-300 bg-white/95 px-8 py-10 text-center shadow-2xl" role="dialog" aria-modal="true" aria-label="Kết quả Rung chuông vàng" onKeyDown={(event) => {
          if (event.key === "Escape") stopRef.current();
          if (event.key === "Tab") {
            const buttons = event.currentTarget.querySelectorAll("button");
            const first = buttons[0];
            const last = buttons[buttons.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
          }
        }}>
          <button type="button" onClick={() => stopRef.current()} aria-label="Đóng chúc mừng" className="pointer-events-auto absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100">
            <X size={20} />
          </button>
          <Trophy className="mx-auto mb-3 text-yellow-500" size={52} />
          <p className="text-sm font-bold uppercase tracking-widest text-yellow-700">Chúc mừng thí sinh cuối cùng!</p>
          <p ref={nameRef} className="mt-3 break-words text-3xl font-black text-green-800" />
          <p className="mt-2 text-gray-600">Thí sinh duy nhất còn lại trong sân thi đấu</p>
          <p ref={detailsRef} className="mt-4 text-sm leading-6 text-gray-600" />
          <button type="button" onClick={() => stopRef.current()} className="mt-6 rounded-xl bg-green-700 px-6 py-3 font-bold text-white hover:bg-green-800">Đóng kết quả</button>
        </div>
      </div>
    </div>
  );
};

export default GoldenBellWinnerPopup;
