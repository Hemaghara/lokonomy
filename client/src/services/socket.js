import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const connectSocket = (userId) => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.on("connect", () => {
      s.emit("registerUser", userId);
    });
  } else {
    s.emit("registerUser", userId);
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
