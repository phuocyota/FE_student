import { API } from "./endpoint";
import { fetch, parseResponse } from "./client";

export const getQuestionBankDetail = async (questionBankId, token) => {
  const res = await fetch(API.QUESTION_BANK.DETAIL(questionBankId), {}, token);
  return parseResponse(res);
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
