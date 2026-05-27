import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";
import { chatService } from "../services";
import {
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
  HiOutlineCog6Tooth,
  HiOutlineArrowsPointingOut,
  HiOutlineMagnifyingGlass,
  HiOutlineShoppingBag,
  HiOutlineBriefcase,
  HiOutlineNewspaper,
  HiOutlineBuildingStorefront,
  HiOutlineMapPin,
} from "react-icons/hi2";

const ChatBox = ({
  productId,
  sellerId,
  buyerId: propBuyerId,
  otherUserName,
  productName,
  onClose,
  chatType = "product",
  businessId,
  businessName,
  ownerId,
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

  const isBusinessInquiry = chatType === "business_inquiry";

  const isSeller = !isBusinessInquiry && user?.id === sellerId;
  const isBusinessOwner = isBusinessInquiry && user?.id === ownerId;

  const buyerId =
    propBuyerId || (isSeller || isBusinessOwner ? null : user?.id);
  const effectiveSellerId = isBusinessInquiry ? ownerId : sellerId;

  const generateChatRoom = (pId, bId, sId, type, bizId) => {
    if (!bId || !sId) return null;
    const ids = [bId, sId].sort();
    if (type === "business_inquiry") {
      return `biz_${bizId}_${ids[0]}_${ids[1]}`;
    }
    return `${pId}_${ids[0]}_${ids[1]}`;
  };

  const chatRoom = generateChatRoom(
    productId,
    buyerId,
    effectiveSellerId,
    chatType,
    businessId,
  );

  const displayName =
    otherUserName ||
    (isBusinessInquiry
      ? isBusinessOwner
        ? "Customer"
        : businessName
      : isSeller
        ? "Customer"
        : "Seller");

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!user || !chatRoom) return;

    const socket = connectSocket({
      userId: user.id || user._id,
      isAdmin: false,
    });
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
  }, [user?.id, effectiveSellerId, buyerId, productId, businessId, chatRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

  const fetchMessages = async () => {
    if (!buyerId || !effectiveSellerId) return;
    try {
      setLoading(true);
      const res = isBusinessInquiry
        ? await chatService.getBusinessMessages(
          businessId,
          buyerId,
          effectiveSellerId,
        )
        : await chatService.getMessages(productId, buyerId, effectiveSellerId);

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

    const receiverId =
      user.id === effectiveSellerId ? buyerId : effectiveSellerId;

    socketSendMessage({
      chatRoom,
      productId: isBusinessInquiry ? null : productId,
      businessId: isBusinessInquiry ? businessId : null,
      chatType,
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

  const handleSuggestionClick = (text) => {
    setNewMessage(text);
    inputRef.current?.focus();
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

  // Suggestion chips config
  const suggestionChips = isBusinessInquiry
    ? [
      { icon: <HiOutlineMagnifyingGlass className="text-xs" />, label: "Services Offered" },
      { icon: <HiOutlineShoppingBag className="text-xs" />, label: "Pricing Info" },
      { icon: <HiOutlineBriefcase className="text-xs" />, label: "Business Hours" },
      { icon: <HiOutlineNewspaper className="text-xs" />, label: "Latest Offers" },
    ]
    : [
      { icon: <HiOutlineMagnifyingGlass className="text-xs" />, label: "Product Details" },
      { icon: <HiOutlineShoppingBag className="text-xs" />, label: "Availability" },
      { icon: <HiOutlineBriefcase className="text-xs" />, label: "Delivery Info" },
      { icon: <HiOutlineNewspaper className="text-xs" />, label: "Best Price" },
    ];

  // Notify AIGuide to hide when ChatBox is open
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("chatbox-visibility", { detail: { visible: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent("chatbox-visibility", { detail: { visible: false } }));
    };
  }, []);

  if (!user || !chatRoom) return null;

  const welcomeMessage = isBusinessInquiry
    ? `Hi! I'm here to help you connect with ${businessName || "this business"}. Ask about services, pricing, availability, or anything else. How can I help you today?`
    : `Hi! Start a conversation about ${productName || "this product"}. Ask about details, pricing, delivery, or make an offer. How can I help?`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed z-[9999] flex flex-col overflow-hidden shadow-2xl shadow-black/60 inset-0 rounded-none sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[400px] sm:max-w-[calc(100vw-2rem)] sm:h-[580px] sm:max-h-[calc(100vh-6rem)] sm:rounded-2xl"
      style={{
        background: "linear-gradient(165deg, #0a0f1e 0%, #0d1529 40%, #111d35 100%)",
        border: "1px solid rgba(99, 102, 241, 0.1)",
      }}
    >

      <div
        className="flex items-center justify-between px-4 py-3.5 shrink-0 relative"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">

          <div className="relative">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg"
              style={{
                background: isBusinessInquiry
                  ? "linear-gradient(135deg, #7c3aed, #6366f1)"
                  : "linear-gradient(135deg, #6366f1, #4f46e5)",
              }}
            >
              {isBusinessInquiry ? (
                <HiOutlineBuildingStorefront className="text-lg" />
              ) : (
                displayName?.charAt(0)?.toUpperCase() || "?"
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0d1529]" />
          </div>

          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate leading-tight">
              {displayName}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
              <span className="text-[10px] text-emerald-400/80 font-semibold uppercase tracking-wider">
                {isBusinessInquiry ? "Business" : "Online"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all"
            aria-label="Settings"
          >
            <HiOutlineCog6Tooth className="text-sm" />
          </button>
          <button
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all hidden sm:flex"
            aria-label="Expand"
          >
            <HiOutlineArrowsPointingOut className="text-sm" />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 flex items-center justify-center text-slate-500 hover:text-red-400 transition-all"
            aria-label="Close chat"
          >
            <HiOutlineXMark className="text-base" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
            <span className="text-slate-600 text-[10px] font-semibold uppercase tracking-[0.2em]">
              Loading messages…
            </span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col h-full">
            <div className="flex items-start gap-2.5 mb-4 mt-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: isBusinessInquiry
                    ? "linear-gradient(135deg, #7c3aed, #6366f1)"
                    : "linear-gradient(135deg, #6366f1, #4f46e5)",
                }}
              >
                {isBusinessInquiry ? (
                  <HiOutlineBuildingStorefront className="text-sm text-white" />
                ) : (
                  <HiOutlineChatBubbleLeftRight className="text-sm text-white" />
                )}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-md relative"
                style={{
                  background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)",
                  border: "1px solid rgba(99,102,241,0.15)",
                }}
              >
                <p className="text-slate-200 text-[13px] leading-relaxed">
                  {welcomeMessage}
                </p>
              </motion.div>
            </div>

            <div className="flex-1" />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="flex flex-wrap gap-2 pb-2"
            >
              {suggestionChips.map((chip, i) => (
                <motion.button
                  key={chip.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.6 + i * 0.08 }}
                  onClick={() => handleSuggestionClick(chip.label)}
                  className="group flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
                  style={{
                    background: "rgba(99, 102, 241, 0.06)",
                    border: "1px solid rgba(99, 102, 241, 0.15)",
                    color: "rgba(165, 160, 255, 0.9)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.14)";
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.35)";
                    e.currentTarget.style.color = "#c4b5fd";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.06)";
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.15)";
                    e.currentTarget.style.color = "rgba(165, 160, 255, 0.9)";
                  }}
                >
                  {chip.icon}
                  {chip.label}
                </motion.button>
              ))}
            </motion.div>
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
                    {!isMine && (
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0 mr-2 mt-auto mb-1"
                        style={{
                          background: isBusinessInquiry
                            ? "linear-gradient(135deg, #7c3aed, #6366f1)"
                            : "linear-gradient(135deg, #6366f1, #4f46e5)",
                        }}
                      >
                        {isBusinessInquiry ? (
                          <HiOutlineBuildingStorefront className="text-xs" />
                        ) : (
                          (msg.senderName?.[0] || "?").toUpperCase()
                        )}
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl relative group ${isMine
                        ? "rounded-br-md shadow-lg"
                        : "rounded-bl-md border border-white/4"
                        }`}
                      style={
                        isMine
                          ? {
                            background: isSeller || isBusinessOwner
                              ? "linear-gradient(135deg, #059669, #0d9488)"
                              : "linear-gradient(135deg, #7c3aed, #6366f1)",
                            boxShadow: isSeller || isBusinessOwner
                              ? "0 4px 16px rgba(5,150,105,0.2)"
                              : "0 4px 16px rgba(99,102,241,0.2)",
                          }
                          : {
                            background: "rgba(255,255,255,0.04)",
                          }
                      }
                    >
                      {!isMine && (
                        <p className="text-[10px] font-semibold text-violet-400 mb-0.5">
                          {msg.senderName}
                        </p>
                      )}
                      <p className="text-[13px] leading-relaxed wrap-break-words text-white">
                        {msg.message}
                      </p>
                      <div
                        className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"
                          }`}
                      >
                        <span
                          className={`text-[9px] ${isMine ? "text-white/50" : "text-slate-600"
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

      <div
        className="shrink-0"
        style={{
          background: "linear-gradient(180deg, rgba(10,15,30,0.6) 0%, rgba(10,15,30,0.95) 100%)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {messages.length > 0 && (
          <div className="px-3 pt-2 pb-0 flex gap-1.5 overflow-x-auto scrollbar-hide">
            {suggestionChips.slice(0, 3).map((chip) => (
              <button
                key={chip.label}
                onClick={() => handleSuggestionClick(chip.label)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap shrink-0 transition-all"
                style={{
                  background: "rgba(99, 102, 241, 0.06)",
                  border: "1px solid rgba(99, 102, 241, 0.1)",
                  color: "rgba(165, 160, 255, 0.7)",
                }}
              >
                {chip.icon}
                {chip.label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="px-3 py-2.5">
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all duration-300 focus-within:shadow-lg"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(99,102,241,0.1)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(99,102,241,0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleTyping}
              placeholder={
                isSeller || isBusinessOwner
                  ? "Reply to customer…"
                  : "Ask about businesses, jobs…"
              }
              className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-slate-600 outline-none py-2"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white transition-all duration-300 active:scale-[0.93] shrink-0 disabled:opacity-20"
              style={{
                background: (!newMessage.trim() || sending)
                  ? "rgba(99,102,241,0.15)"
                  : "linear-gradient(135deg, #7c3aed, #6366f1)",
                boxShadow: (!newMessage.trim() || sending)
                  ? "none"
                  : "0 4px 12px rgba(99,102,241,0.3)",
              }}
            >
              <HiOutlinePaperAirplane className="text-sm rotate-[-35deg]" />
            </button>
          </div>
        </form>

        <div className="flex items-center justify-center gap-1.5 pb-3 pt-0.5">
          <span className="text-[10px] text-slate-600 font-medium flex items-center gap-1">
            <span className="text-xs">✨</span>
            Powered by <span className="text-violet-400/70 font-semibold">Lokonomy Intelligence</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatBox;
