import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";
import { chatService } from "../services";
import ChatBox from "../components/ChatBox";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowLeft,
  HiOutlineShoppingBag,
  HiOutlineClock,
  HiOutlineArrowUturnLeft,
  HiOutlineXMark,
} from "react-icons/hi2";

const MyChats = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null); // currently open chat

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user) fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await chatService.getConversations();
      if (res.data.success) {
        setConversations(res.data.chats);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const handleOpenChat = (chat) => {
    setActiveChat(chat);
  };

  const handleCloseChat = () => {
    setActiveChat(null);
    fetchConversations();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#080e1a] flex items-center justify-center pt-20">
        <p className="text-slate-500 text-sm">
          Please log in to view your chats.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .chats-page * { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="chats-page max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors mb-4"
          >
            <HiOutlineArrowLeft className="text-sm" /> Back
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <HiOutlineChatBubbleLeftRight className="text-xl text-white" />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">My Chats</h1>
              <p className="text-slate-500 text-xs">
                {conversations.length} conversation
                {conversations.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
            <span className="text-slate-600 text-[10px] font-medium uppercase tracking-widest">
              Loading conversations…
            </span>
          </div>
        ) : conversations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/10 flex items-center justify-center">
              <HiOutlineChatBubbleLeftRight className="text-3xl text-violet-400" />
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-sm font-medium">
                No conversations yet
              </p>
              <p className="text-slate-600 text-xs mt-1">
                Start chatting with sellers on product pages
              </p>
            </div>
            <button
              onClick={() => navigate("/market")}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all mt-2"
            >
              <HiOutlineShoppingBag /> Browse Market
            </button>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {conversations.map((chat, index) => {
                const isActive = activeChat && activeChat._id === chat._id;

                return (
                  <motion.div
                    key={chat._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={`rounded-xl border transition-all overflow-hidden ${
                      isActive
                        ? "border-violet-500/30 bg-[#131d2e]"
                        : "border-[#1f2a3d] bg-[#111827] hover:bg-[#131d2e] hover:border-violet-500/20"
                    }`}
                  >
                    <button
                      onClick={() =>
                        isActive ? handleCloseChat() : handleOpenChat(chat)
                      }
                      className="w-full flex items-center gap-3 p-3.5 text-left group"
                    >
                      <div className="relative shrink-0">
                        {chat.product?.productImages?.[0] ? (
                          <img
                            src={chat.product.productImages[0]}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover border border-[#1f2a3d]"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/10 flex items-center justify-center">
                            <HiOutlineShoppingBag className="text-lg text-violet-400" />
                          </div>
                        )}
                        {chat.unreadCount > 0 && !isActive && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-lg shadow-violet-600/40">
                            {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">
                              {chat.otherUserName || "User"}
                            </p>
                            {chat.isSeller && (
                              <span className="text-[8px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md shrink-0">
                                Customer
                              </span>
                            )}
                            {!chat.isSeller && (
                              <span className="text-[8px] font-bold uppercase tracking-wider bg-violet-500/15 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-md shrink-0">
                                Seller
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-600 flex items-center gap-1 shrink-0 ml-2">
                            <HiOutlineClock className="text-[10px]" />
                            {formatTime(chat.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] truncate mb-0.5">
                          re: {chat.product?.productName || "Product"}
                        </p>
                        <p className="text-slate-400 text-xs truncate">
                          {chat.lastSenderId?.toString() === user.id
                            ? "You: "
                            : ""}
                          {chat.lastMessage}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {isActive ? (
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500">
                            <HiOutlineXMark className="text-sm" />
                          </div>
                        ) : chat.unreadCount > 0 ? (
                          <div className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors">
                            <HiOutlineArrowUturnLeft className="text-xs" />
                            Reply
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-violet-600/20 flex items-center justify-center text-slate-600 group-hover:text-violet-400 transition-all">
                            <HiOutlineChatBubbleLeftRight className="text-sm" />
                          </div>
                        )}
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeChat && (
          <ChatBox
            productId={
              activeChat.productId?.toString() || activeChat.product?._id
            }
            sellerId={activeChat.sellerId}
            buyerId={activeChat.buyerId}
            otherUserName={activeChat.otherUserName}
            productName={activeChat.product?.productName || "Product"}
            onClose={handleCloseChat}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyChats;
