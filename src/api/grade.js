import { apiRequest } from "./client";
import { API } from "./endpoint";

export const getGrades = () => {
  return apiRequest(API.GRADE.GET_ALL, {
    method: "GET",
    skipAuth: true,
  });
};

export const getExamSetDetail = (id) => {
  return apiRequest(API.EXAM_SET.DETAIL(id), {
    method: "GET",
  });
};
