import { apiRequest } from "./client";

const LOGIN_PATH = "/auth/login/student";

export const loginStudent = ({ username, password, deviceId }) =>
  apiRequest(LOGIN_PATH, {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
      deviceId,
    }),
  });
