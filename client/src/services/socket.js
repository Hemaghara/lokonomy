
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.MODE === "development" 
  ? "http://localhost:5000" 
  : "https://lokonomy.onrender.com";

let socket = null;

export const getSocket = (token) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { token },
    });
  } else if (token) {
    socket.auth = { token };
  }
  return socket;
};

export const connectSocket = (userData) => {
  const token = userData?.token || (typeof userData === "string" ? null : userData?.token);
  const s = getSocket(token);
  s.off("connect");

  if (!s.connected) {
    s.connect();
    s.on("connect", () => {
      s.emit("registerUser", userData);
    });
  } else {
    s.emit("registerUser", userData);
  }
  return s;
};
export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};
export const joinRoom = (chatRoom) => {
  const s = getSocket();
  s.emit("joinRoom", { chatRoom });
};
export const leaveRoom = (chatRoom) => {
  const s = getSocket();
  s.emit("leaveRoom", { chatRoom });
};
export const sendMessage = (data) => {
  const s = getSocket();
  s.emit("sendMessage", data);
};
export const emitTyping = (chatRoom, userName) => {
  const s = getSocket();
  s.emit("typing", { chatRoom, userName });
};
export const emitStopTyping = (chatRoom) => {
  const s = getSocket();
  s.emit("stopTyping", { chatRoom });
};
export const emitMarkRead = (chatRoom, userId) => {
  const s = getSocket();
  s.emit("markRead", { chatRoom, userId });
};
export const joinStoryFeed = (district) => {
  const s = getSocket();
  s.emit("joinStoryFeed", { district });
};
export const leaveStoryFeed = (district) => {
  const s = getSocket();
  s.emit("leaveStoryFeed", { district });
};

// Feed real-time room helpers
export const joinFeedRoom = (feedId) => {
  const s = getSocket();
  s.emit("joinFeedRoom", { feedId });
};
export const leaveFeedRoom = (feedId) => {
  const s = getSocket();
  s.emit("leaveFeedRoom", { feedId });
};
export const joinFeedDistrict = (district) => {
  const s = getSocket();
  s.emit("joinFeedDistrict", { district });
};
export const leaveFeedDistrict = (district) => {
  const s = getSocket();
  s.emit("leaveFeedDistrict", { district });
};
