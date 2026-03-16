//It acts as a communication layer between your React frontend and the Socket.IO server.

import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

let socket = null;

/*creating and returning a single Socket.IO connection for the entire frontend application.
It ensures that only one socket instance exists (called a singleton pattern). */
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

//user is connected and identified on the server.
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
//disconnect the socket connection.
export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};
//join a chat room.
export const joinRoom = (chatRoom) => {
  const s = getSocket();
  s.emit("joinRoom", { chatRoom });
};
//leave the room
export const leaveRoom = (chatRoom) => {
  const s = getSocket();
  s.emit("leaveRoom", { chatRoom });
};
//send the message
export const sendMessage = (data) => {
  const s = getSocket();
  s.emit("sendMessage", data);
};
//start typing 
export const emitTyping = (chatRoom, userName) => {
  const s = getSocket();
  s.emit("typing", { chatRoom, userName });
};
//stop typing
export const emitStopTyping = (chatRoom) => {
  const s = getSocket();
  s.emit("stopTyping", { chatRoom });
};
//mark as read message.
export const emitMarkRead = (chatRoom, userId) => {
  const s = getSocket();
  s.emit("markRead", { chatRoom, userId });
};
