import { API } from "./endpoint";
import { fetch, parseResponse } from "./client";

const GOLDEN_BELL_EXAM_SET_ID =
  import.meta.env.VITE_GOLDEN_BELL_EXAM_SET_ID ||
  "21008c89-ab07-467e-9719-1df6f8f063b2";

export const getQuestionBankDetail = async (questionBankId, token) => {
  const res = await fetch(API.QUESTION_BANK.DETAIL(questionBankId), {}, token);
  return parseResponse(res);
};

export const getQuestionBankStructure = async (questionBankId) => {
  const res = await fetch(
    `${API.QUESTION_BANK.DETAIL(questionBankId)}/structure`,
    {},
    null
  );
  return parseResponse(res);
};

export const getCurrentGoldenBellQuestionBank = async (token) => {
  const response = await fetch(
    API.EXAM_SET.DETAIL(GOLDEN_BELL_EXAM_SET_ID),
    {},
    token
  );
  const payload = await parseResponse(response);
  const examSet = payload?.data?.data || payload?.data || payload;
  const questionBank = Array.isArray(examSet?.questionBanks)
    ? examSet.questionBanks[0]
    : null;

  if (!questionBank?.id) {
    throw new Error("Bộ đề Rung chuông vàng chưa có đề thi");
  }

  return questionBank;
};

export const getQuestionBankOptions = async (token) => {
  const params = new URLSearchParams({ page: "1", size: "1000" });
  const response = await fetch(
    `${API.QUESTION_BANK.LIST}?${params.toString()}`,
    {},
    token
  );
  const payload = await parseResponse(response);
  const data = payload?.data?.data || payload?.data || payload;
  const questionBanks = Array.isArray(data)
    ? data
    : data?.questionBanks || data?.items || data?.results || [];

  return questionBanks
    .filter((questionBank) => questionBank?.id)
    .map((questionBank) => ({
      id: questionBank.id,
      name:
        questionBank.title ||
        questionBank.name ||
        questionBank.code ||
        "Đề thi chưa có tên",
      examSetName:
        questionBank.examSetName ||
        questionBank.examSet?.name ||
        questionBank.examSet?.title ||
        "",
      gradeName:
        questionBank.gradeName ||
        questionBank.grade?.name ||
        questionBank.examSet?.grade?.name ||
        "",
      subjectName:
        questionBank.subjectName ||
        questionBank.subject?.name ||
        questionBank.examSet?.subject?.name ||
        "",
      totalQuestions: questionBank.totalQuestions,
    }))
    .sort((a, b) =>
    `${a.gradeName} ${a.subjectName} ${a.name}`.localeCompare(
      `${b.gradeName} ${b.subjectName} ${b.name}`,
      "vi"
    )
  );
};

export const getRandomQuestion = async (
  questionBankId,
  excludeQuestionIds = []
) => {
  const params = new URLSearchParams();
  const excludedIds = excludeQuestionIds.filter(Boolean);

  if (excludedIds.length > 0) {
    params.set("excludeQuestionIds", excludedIds.join(","));
  }

  const query = params.toString();
  const url = `${API.QUESTION_BANK.RANDOM(questionBankId)}${
    query ? `?${query}` : ""
  }`;

  const res = await fetch(url, {}, null);

  if (res.status === 404) {
    const error = new Error("Da het cau hoi trong ngan hang");
    error.status = 404;
    throw error;
  }

  return parseResponse(res);
};
