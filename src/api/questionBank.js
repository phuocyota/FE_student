import { API } from "./endpoint";
import { fetch, parseResponse } from "./client";

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

  const res = await fetch(url);

  if (res.status === 404) {
    const error = new Error("Da het cau hoi trong ngan hang");
    error.status = 404;
    throw error;
  }

  return parseResponse(res);
};
