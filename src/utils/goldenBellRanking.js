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

export const getPodiumSelections = (room) => {
  const selections = {};
  const used = new Set();
  for (const rank of [1, 2, 3]) {
    const id = room.podiumSelections?.[rank];
    if (id === null) selections[rank] = null;
    else if (room.students?.some((student) => student.id === id) && !used.has(id)) {
      selections[rank] = id;
      used.add(id);
    }
  }
  return selections;
};

export const getGoldenBellRanking = (room, automatic = getAutomaticGoldenBellRanking(room)) => {
  const selections = getPodiumSelections(room);
  const manual = Object.keys(selections).length > 0;
  const winnerConfirmed = automatic.some((student) => student.isWinner);
  const counts = countRanks(automatic);
  return automatic.map((student) => {
    const selectedRank = Object.keys(selections).find((rank) => selections[rank] === student.id);
    if (selectedRank) return { ...student, rank: Number(selectedRank), isWinner: Number(selectedRank) === 1, isTeacherSelected: true };
    let rank = student.rank;
    if ((manual && rank <= 3) || (winnerConfirmed && (rank === 2 || rank === 3) && counts.get(rank) > 1)) rank = null;
    return { ...student, rank, isWinner: !manual && student.isWinner, isTeacherSelected: false };
  }).sort((a, b) => {
    if (a.rank === null && b.rank !== null) return winnerConfirmed || manual ? 1 : -1;
    if (a.rank !== null && b.rank === null) return winnerConfirmed || manual ? -1 : 1;
    return (a.rank || 0) - (b.rank || 0) || (b.correctCount || 0) - (a.correctCount || 0) || (a.name || "").localeCompare(b.name || "", "vi");
  });
};

export const getRankingSelectionView = (room) => {
  const automatic = getAutomaticGoldenBellRanking(room);
  const ranking = getGoldenBellRanking(room, automatic);
  const rankedById = new Map(ranking.map((student) => [student.id, student]));
  const participants = automatic.map((student) => ({ ...rankedById.get(student.id), canChooseFirst: true, canChooseSecond: true, canChooseThird: true }));
  return { ranking, participants, selections: getPodiumSelections(room), assignable: { 1: true, 2: true, 3: true } };
};

export const getPodiumEditSecondsRemaining = (room, now = Date.now()) => {
  const endedAt = Date.parse(room?.endedAt || "");
  if (room?.status !== "FINISHED" || !Number.isFinite(endedAt) || now < endedAt) return 0;
  return Math.max(0, Math.ceil((endedAt + 60_000 - now) / 1000));
};

export const canSelectPodiumRank = (room, rank) => [1, 2, 3].includes(rank) && getPodiumEditSecondsRemaining(room) > 0;

export const updatePodiumSelection = (room, rank, studentId) => {
  if (!canSelectPodiumRank(room, rank)) throw new Error("Chỉ được chỉnh hạng 1, 2, 3 trong 1 phút sau khi kết thúc sàn đấu.");
  if (studentId && !room.students?.some((student) => student.id === studentId)) throw new Error("Không tìm thấy thí sinh trong phòng.");
  let selections = getPodiumSelections(room);
  if (!Object.keys(selections).length) {
    const ranking = getGoldenBellRanking(room);
    selections = Object.fromEntries([1, 2, 3].map((place) => {
      const candidates = ranking.filter((student) => student.rank === place);
      return [place, candidates.length === 1 ? candidates[0].id : null];
    }));
  }
  for (const place of [1, 2, 3]) if (selections[place] === studentId) selections[place] = null;
  return { ...room, podiumSelections: { ...selections, [rank]: studentId || null } };
};

export const podiumSelectionsKey = (roomId) => `golden_bell_podium_live_${roomId}`;

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
  return { ...next, ...(next.questionNo === 0 && previous?.questionNo > 0 ? { podiumSelections: {} } : {}), students: students.map((student) => {
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

export const rankingCacheKey = (roomId) => `golden_bell_ranking_live_${roomId}`;

export const openGoldenBellRanking = (navigate, room, returnTo) => {
  const roomId = room.roomId || room.code;
  try { localStorage.setItem(rankingCacheKey(roomId), JSON.stringify(room)); } catch { /* Navigation still works if storage is full. */ }
  navigate(`/xep-hang?room=${encodeURIComponent(roomId)}`, { state: { room, returnTo } });
};
