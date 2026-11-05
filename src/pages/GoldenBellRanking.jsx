import React from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import RankingRoom from "../components/GoldenBellRanking/RankingRoom";
import RankingRoomForm from "../components/GoldenBellRanking/RankingRoomForm";
import { hasTeacherRankingSession } from "../utils/goldenBellRanking";

export default function GoldenBellRanking() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const requestedRoom = params.get("room") || "";
  const roomId = /^\d{6}$/.test(requestedRoom) ? requestedRoom : "";
  const isDemo = params.get("demo") === "1";
  const canManage = isDemo ? params.get("manage") === "1" : hasTeacherRankingSession();
  const suppliedReturn = location.state?.returnTo;
  const returnTo = typeof suppliedReturn === "string" && /^\/(golden-bell(?:-arena)?|teacher)(\/|\?|$)/.test(suppliedReturn)
    ? suppliedReturn
    : isDemo ? `/teacher/demo?room=${roomId}` : `/golden-bell/${roomId}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-gray-50 to-white">
      {roomId ? (
        <RankingRoom
          key={`${roomId}-${isDemo}`}
          roomId={roomId}
          isDemo={isDemo}
          canManage={canManage}
          snapshot={location.state?.room}
          returnTo={returnTo}
        />
      ) : (
        <RankingRoomForm onSelectRoom={setParams} />
      )}
    </div>
  );
}
