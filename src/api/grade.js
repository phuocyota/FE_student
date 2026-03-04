import { apiRequest } from "./client";

export const getGrades = () => {
  return apiRequest("/grade", {
    method: "GET",
  });
};