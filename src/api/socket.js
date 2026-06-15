import { io } from "socket.io-client";
import { BASE_URL } from "./client";

export const createAppSocket = (tokenOverride) => {
  const token =
    tokenOverride ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("teacherAccessToken") ||
    "guest";

  return io(BASE_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 800,
  });
};
