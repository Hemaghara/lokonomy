import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";
import { chatService } from "../services";
import {
  getSocket,
  connectSocket,
  joinRoom,
  leaveRoom,
  sendMessage as socketSendMessage,
  emitTyping,
  emitStopTyping,
  emitMarkRead,
} from "../services/socket";
import {
  HiOutlinePaperAirplane,
  HiOutlineXMark,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

const ChatBox = ({
  productId,
  sellerId,
  buyerId: propBuyerId,
  otherUserName,
  productName,
  onClose,
}) => {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const isSeller = user?.id === sellerId;
  const buyerId = propBuyerId || (isSeller ? null : user?.id);
  const chatRoom = generateChatRoom(productId, buyerId, sellerId);

  const displayName = otherUserName || (isSeller ? "Customer" : "Seller");

  function generateChatRoom(productId, buyerId, sellerId) {
    if (!buyerId || !sellerId) return null;
    const ids = [buyerId, sellerId].sort();
    return `${productId}_${ids[0]}_${ids[1]}`;
  }

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!user || !chatRoom) return;

    const socket = connectSocket(user.id);

    joinRoom(chatRoom);

    socket.on("receiveMessage", (message) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
      if (
        message.receiverId === user.id ||
        message.receiverId?._id === user.id
      ) {
        emitMarkRead(chatRoom, user.id);
      }
    });

    socket.on("userTyping", ({ userName }) => {
      setTypingUser(userName);
    });

    socket.on("userStopTyping", () => {
      setTypingUser(null);
    });

    socket.on("messagesRead", () => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (
            (msg.senderId === user.id || msg.senderId?._id === user.id) &&
            !msg.read
          ) {
            return { ...msg, read: true };
          }
          return msg;
        }),
      );
    });

    fetchMessages();

    return () => {
      leaveRoom(chatRoom);
      socket.off("receiveMessage");
      socket.off("userTyping");
      socket.off("userStopTyping");
      socket.off("messagesRead");
    };
  }, [user?.id, sellerId, buyerId, productId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

  const fetchMessages = async () => {
    if (!buyerId || !sellerId) return;
    try {
      setLoading(true);
      const res = await chatService.getMessages(productId, buyerId, sellerId);
      if (res.data.success) {
        setMessages(res.data.messages);
        emitMarkRead(chatRoom, user.id);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !chatRoom) return;

    setSending(true);

    const receiverId = user.id === sellerId ? buyerId : sellerId;

    socketSendMessage({
      chatRoom,
      productId,
      senderId: user.id,
      receiverId,
      senderName: user.name,
      message: newMessage.trim(),
    });

    emitStopTyping(chatRoom);
    setNewMessage("");
    setSending(false);
    inputRef.current?.focus();
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    emitTyping(chatRoom, user.name);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(chatRoom);
    }, 2000);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  if (!user || !chatRoom) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed bottom-4 right-4 w-95 max-w-[calc(100vw-2rem)] h-130 max-h-[calc(100vh-6rem)] z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-black/40"
      style={{
        background: "linear-gradient(145deg, #0d1321, #121a2e)",
        border: "1px solid rgba(99, 102, 241, 0.12)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg ${
              isSeller
                ? "bg-linear-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20"
                : "bg-linear-to-br from-violet-500 to-indigo-600 shadow-violet-500/20"
            }`}
          >
            {displayName?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {displayName}
            </p>
          
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all"
        >
          <HiOutlineXMark className="text-base" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 scrollbar-thin">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="w-7 h-7 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
            <span className="text-slate-600 text-[10px] font-medium uppercase tracking-widest">
              Loading messages…
            </span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/10 flex items-center justify-center">
              <HiOutlineChatBubbleLeftRight className="text-2xl text-violet-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">
                {isSeller ? "No messages yet" : "Start the conversation"}
              </p>
              <p className="text-slate-600 text-xs mt-1">
                {isSeller ? (
                  <>
                    Waiting for customer questions about{" "}
                    <span className="text-violet-400">{productName}</span>
                  </>
                ) : (
                  <>
                    Send a message about{" "}
                    <span className="text-violet-400">{productName}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center justify-center my-3">
                <span className="text-[10px] font-medium text-slate-600 bg-white/3 border border-white/5 px-3 py-1 rounded-full">
                  {date}
                </span>
              </div>
              {msgs.map((msg, index) => {
                const isMine =
                  msg.senderId === user.id || msg.senderId?._id === user.id;
                return (
                  <motion.div
                    key={msg._id || index}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex mb-1.5 ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-3.5 py-2 rounded-2xl relative group ${
                        isMine
                          ? isSeller
                            ? "bg-linear-to-br from-emerald-600 to-teal-600 text-white rounded-br-md shadow-lg shadow-emerald-900/20"
                            : "bg-linear-to-br from-violet-600 to-indigo-600 text-white rounded-br-md shadow-lg shadow-violet-900/20"
                          : "bg-white/6 text-slate-200 rounded-bl-md border border-white/4"
                      }`}
                    >
                      {!isMine && (
                        <p className="text-[10px] font-semibold text-violet-400 mb-0.5">
                          {msg.senderName}
                        </p>
                      )}
                      <p className="text-[13px] leading-relaxed wrap-break-words">
                        {msg.message}
                      </p>
                      <div
                        className={`flex items-center gap-1 mt-0.5 ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span
                          className={`text-[9px] ${
                            isMine ? "text-white/50" : "text-slate-600"
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </span>
                        {isMine && msg.read && (
                          <HiOutlineCheckCircle className="text-[10px] text-emerald-300" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))
        )}

        <AnimatePresence>
          {typingUser && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center gap-2 px-1 py-1"
            >
              <div className="flex items-center gap-1 bg-white/4 border border-white/5 px-3 py-2 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span
                    className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 ml-1.5">
                  {typingUser} is typing…
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="px-3 py-3 shrink-0"
        style={{
          background: "rgba(13, 19, 33, 0.8)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-center gap-2 bg-white/4 border border-white/6 rounded-xl px-3 py-1.5 focus-within:border-violet-500/30 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder={isSeller ? "Reply to customer…" : "Type a message…"}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none py-1.5"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all active:scale-90 shrink-0 disabled:opacity-30 ${
              isSeller
                ? "bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                : "bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
            }`}
          >
            <HiOutlinePaperAirplane className="text-sm -rotate-90" />
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ChatBox;
