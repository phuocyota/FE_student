import { io } from "socket.io-client";
import { BASE_URL } from "./client";

const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL || BASE_URL
).replace(/\/$/, "");

export const createAppSocket = (tokenOverride) => {
  const token =
    tokenOverride ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("teacherAccessToken") ||
    "guest";

  return io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 800,
  });
};
