import { apiRequest } from "./client";
import { API } from "./endpoint";

export const loginStudent = ({ username, password, deviceId }) =>
  apiRequest(API.AUTH.LOGIN_STUDENT, {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
      deviceId,
    }),
  });
