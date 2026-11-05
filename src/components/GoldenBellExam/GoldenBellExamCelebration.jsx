import React from "react";
import GoldenBellWinnerPopup from "../GoldenBell/GoldenBellWinnerPopup";

export default function GoldenBellExamCelebration({ room, roomId, studentId }) {
  return <GoldenBellWinnerPopup room={room} roomId={roomId} eligibleStudentId={studentId} />;
}
