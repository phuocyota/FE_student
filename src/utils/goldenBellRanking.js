import { getGoldenBellWinner } from "./goldenBellWinner.js";

const eliminationRound = (student) => Number(student.eliminatedQuestionNo || student.lastQuestionNo || 0);

export const getAutomaticGoldenBellRanking = (room) => {
  const students = Array.isArray(room?.students) ? room.students : [];
  const winner = getGoldenBellWinner(room);
  const eliminated = students.filter((student) => student.status === "eliminated");
  const remaining = students.length - eliminated.length;
  const roundCounts = new Map();
  for (const student of eliminated) {
    const round = eliminationRound(student);
    roundCounts.set(round, (roundCounts.get(round) || 0) + 1);
  }
  const roundRanks = new Map();
  let laterEliminations = 0;
  for (const round of [...roundCounts.keys()].sort((a, b) => b - a)) {
    roundRanks.set(round, Math.max(2, remaining + laterEliminations + 1));
    laterEliminations += roundCounts.get(round);
  }
  return students.map((student) => ({
    ...student,
    rank: student.id === winner?.id ? 1 : student.status === "eliminated"
      ? roundRanks.get(eliminationRound(student))
      : null,
    isWinner: student.id === winner?.id,
  })).sort((a, b) => {
    if (a.rank === null && b.rank !== null) return -1;
    if (a.rank !== null && b.rank === null) return 1;
    return (a.rank || 0) - (b.rank || 0) || (b.correctCount || 0) - (a.correctCount || 0) || (a.name || "").localeCompare(b.name || "", "vi");
  });
};

const countRanks = (ranking) => {
  const counts = new Map();
  for (const student of ranking) counts.set(student.rank, (counts.get(student.rank) || 0) + 1);
  return counts;
};

export const getPodiumSelections = (room, automatic = getAutomaticGoldenBellRanking(room)) => {
  if (!getGoldenBellWinner(room) && room.status !== "FINISHED") return {};
  const counts = countRanks(automatic);
  const selections = {};
  for (const rank of [2, 3]) {
    const id = room.podiumSelections?.[rank];
    const candidate = automatic.find((student) => student.id === id && !student.isWinner && student.status === "eliminated");
    const otherRank = rank === 2 ? 3 : 2;
    const hasOtherPlace = candidate?.rank === otherRank && counts.get(otherRank) === 1;
    if (candidate && !hasOtherPlace && counts.get(rank) !== 1 && !Object.values(selections).includes(id)) selections[rank] = id;
  }
  return selections;
};

export const getGoldenBellRanking = (room, automatic = getAutomaticGoldenBellRanking(room)) => {
  const winnerConfirmed = automatic.some((student) => student.isWinner);
  const selections = getPodiumSelections(room, automatic);
  const counts = countRanks(automatic);
  const reserved = new Set(Object.keys(selections).map(Number));
  return automatic.map((student) => {
    const selectedRank = Object.keys(selections).find((rank) => selections[rank] === student.id);
    if (selectedRank) return { ...student, rank: Number(selectedRank), isTeacherSelected: true };
    let rank = student.rank;
    // Unresolved runners-up wait for the teacher instead of appearing together on a podium.
    if (winnerConfirmed && (rank === 2 || rank === 3) && counts.get(rank) > 1) rank = null;
    while (rank !== null && reserved.has(rank)) rank += 1;
    return { ...student, rank };
  }).sort((a, b) => {
    if (a.rank === null && b.rank !== null) return winnerConfirmed ? 1 : -1;
    if (a.rank !== null && b.rank === null) return winnerConfirmed ? -1 : 1;
    return (a.rank || 0) - (b.rank || 0) || (b.correctCount || 0) - (a.correctCount || 0) || (a.name || "").localeCompare(b.name || "", "vi");
  });
};

export const getRankingSelectionView = (room) => {
  const automatic = getAutomaticGoldenBellRanking(room);
  const ranking = getGoldenBellRanking(room, automatic);
  const selections = getPodiumSelections(room, automatic);
  const counts = countRanks(automatic);
  const finished = automatic.some((student) => student.isWinner) || room.status === "FINISHED";
  const assignable = { 2: finished && counts.get(2) !== 1, 3: finished && counts.get(3) !== 1 };
  const rankedById = new Map(ranking.map((student) => [student.id, student]));
  // Selection does not change the list order, so the next button stays under the pointer.
  const participants = automatic.map((student) => {
    const ranked = rankedById.get(student.id);
    const candidate = student.status === "eliminated" && !student.isWinner;
    return {
      ...ranked,
      canChooseSecond: assignable[2] && candidate && selections[3] !== student.id && !(student.rank === 3 && counts.get(3) === 1),
      canChooseThird: assignable[3] && candidate && selections[2] !== student.id && !(student.rank === 2 && counts.get(2) === 1),
    };
  });
  return { ranking, participants, selections, assignable, secondResolved: ranking.filter((student) => student.rank === 2).length === 1 };
};

export const canSelectPodiumRank = (room, rank, automatic = getAutomaticGoldenBellRanking(room)) => {
  if (![2, 3].includes(rank)) return false;
  if (!getGoldenBellWinner(room) && room.status !== "FINISHED") return false;
  return automatic.filter((student) => student.rank === rank).length !== 1;
};

export const updatePodiumSelection = (room, rank, studentId) => {
  const automatic = getAutomaticGoldenBellRanking(room);
  if (!canSelectPodiumRank(room, rank, automatic)) throw new Error("Chỉ chọn được hạng 2 hoặc 3 còn trống hoặc đồng hạng sau khi có kết quả.");
  const selections = getPodiumSelections(room, automatic);
  if (!studentId) {
    delete selections[rank];
    if (rank === 2) delete selections[3];
    return { ...room, podiumSelections: selections };
  }
  const candidate = automatic.find((student) => student.id === studentId);
  if (!candidate || candidate.isWinner || candidate.status !== "eliminated") throw new Error("Chọn một thí sinh đã hạ bảng và không phải người chiến thắng.");
  const otherRank = rank === 2 ? 3 : 2;
  if (selections[otherRank] === studentId) throw new Error("Thí sinh đã được chọn cho hạng khác.");
  if (candidate.rank === otherRank && automatic.filter((student) => student.rank === otherRank).length === 1) throw new Error("Thí sinh đã có thứ hạng tự động riêng.");
  if (rank === 3 && getGoldenBellRanking(room, automatic).filter((student) => student.rank === 2).length !== 1) throw new Error("Vui lòng xác định hạng 2 trước khi chọn hạng 3.");
  return { ...room, podiumSelections: { ...selections, [rank]: studentId } };
};

export const podiumSelectionsKey = (roomId, isDemo) => `golden_bell_podium_${isDemo ? "demo" : "live"}_${roomId}`;

export const hasTeacherRankingSession = () => {
  try {
    const token = sessionStorage.getItem("teacherAccessToken") || "";
    const encoded = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/") || "";
    const payload = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=")));
    return payload.userType === "TEACHER" && (!payload.exp || payload.exp * 1000 > Date.now());
  } catch { return false; }
};

// Keep the elimination history when a server snapshot omits optional profile fields.
export const withEliminationHistory = (previous, next) => {
  const observedAt = new Date().toISOString();
  const students = Array.isArray(next.students) ? next.students : next.students ? [next.students] : previous?.students || [];
  return { ...next, ...(next.questionNo === 0 ? { podiumSelections: {} } : {}), students: students.map((student) => {
    const old = previous?.students?.find((item) => item.id === student.id);
    const profile = { avatar: student.avatar || old?.avatar, schoolName: student.schoolName || old?.schoolName, className: student.className || old?.className };
    if (student.status !== "eliminated") return { ...student, ...profile, eliminatedAt: null, eliminatedQuestionNo: null };
    return {
      ...student,
      ...profile,
      eliminatedAt: student.eliminatedAt || (old?.status === "eliminated" ? old.eliminatedAt : old ? observedAt : null),
      eliminatedQuestionNo: student.eliminatedQuestionNo || (old?.status === "eliminated" ? old.eliminatedQuestionNo : null) || student.lastQuestionNo || next.questionNo,
    };
  }) };
};

export const rankingCacheKey = (roomId, isDemo) => `golden_bell_ranking_${isDemo ? "demo" : "live"}_${roomId}`;

export const openGoldenBellRanking = (navigate, room, returnTo) => {
  const roomId = room.roomId || room.code;
  const isDemo = Boolean(room.isDemo);
  try { localStorage.setItem(rankingCacheKey(roomId, isDemo), JSON.stringify(room)); } catch { /* Navigation still works if storage is full. */ }
  const teacherView = isDemo && returnTo?.startsWith("/teacher");
  navigate(`/xep-hang?room=${encodeURIComponent(roomId)}${isDemo ? "&demo=1" : ""}${teacherView ? "&manage=1" : ""}`, { state: { room, returnTo } });
};
