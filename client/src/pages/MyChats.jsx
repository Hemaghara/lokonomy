import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";
import { chatService } from "../services";
import ChatBox from "../components/ChatBox";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineShoppingBag,
  HiOutlineBuildingStorefront,
  HiOutlineClock,
  HiOutlineInbox,
} from "react-icons/hi2";

const MyChats = () => {
  const { user } = useUser();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [activeTab, setActiveTab] = useState("product");

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await chatService.getConversations();
      if (res.data.success) {
        setChats(res.data.chats);
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
    } finally {
      setLoading(false);
    }
  };

  const productChats = chats.filter(c => c.chatType === "product" || !c.chatType);
  const businessInquiries = chats.filter(c => c.chatType === "business_inquiry");

  const filteredChats = activeTab === "product" ? productChats : businessInquiries;

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { day: "numeric", month: "short" });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Messages</h1>
            <p className="text-slate-500 text-sm">Manage your private conversations</p>
          </div>

          <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab("product")}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "product"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <HiOutlineShoppingBag className="text-lg" />
              Products
              {productChats.reduce((acc, c) => acc + (c.unreadCount || 0), 0) > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {productChats.reduce((acc, c) => acc + (c.unreadCount || 0), 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("business")}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "business"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <HiOutlineBuildingStorefront className="text-lg" />
              Business
              {businessInquiries.reduce((acc, c) => acc + (c.unreadCount || 0), 0) > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {businessInquiries.reduce((acc, c) => acc + (c.unreadCount || 0), 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Loading chats...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111827] border border-[#1f2a3d] rounded-3xl p-12 text-center"
          >
            <div className="w-20 h-20 bg-linear-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <HiOutlineInbox className="text-4xl text-violet-500/60" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {activeTab === "product" ? "No product chats" : "No business inquiries"}
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8">
              {activeTab === "product" 
                ? "Items you've inquired about or messages from buyers will appear here."
                : "Questions about your business or messages you've sent to businesses will appear here."
              }
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-3">
            {filteredChats.map((chat) => (
              <motion.button
                key={chat._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedChat(chat)}
                className="w-full text-left bg-[#111827] hover:bg-[#161f32] border border-[#1f2a3d] hover:border-violet-500/30 rounded-2xl p-4 transition-all group flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/10 flex items-center justify-center text-xl font-bold text-violet-400 shrink-0">
                  {chat.otherUserName?.[0]?.toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-slate-200 font-bold group-hover:text-white transition-colors truncate">
                      {chat.otherUserName}
                    </h4>
                    <div className="flex items-center gap-2">
                      {chat.unreadCount > 0 && (
                        <span className="bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {chat.unreadCount}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                        {formatDate(chat.lastMessageAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                      chat.chatType === "business_inquiry"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/10"
                    }`}>
                      {chat.chatType === "business_inquiry" ? "Business" : "Product"}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold truncate">
                      {chat.chatType === "business_inquiry" 
                        ? chat.business?.businessName 
                        : chat.product?.productName}
                    </span>
                  </div>
                  
                  <p className="text-slate-500 text-sm truncate leading-relaxed">
                    {chat.lastSenderId?.toString() === user.id?.toString() ? "You: " : ""}
                    {chat.lastMessage}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedChat && (
          <ChatBox
            productId={selectedChat.productId}
            sellerId={selectedChat.sellerId}
            buyerId={selectedChat.buyerId}
            otherUserName={selectedChat.otherUserName}
            productName={selectedChat.product?.productName}
            chatType={selectedChat.chatType}
            businessId={selectedChat.businessId}
            businessName={selectedChat.business?.businessName}
            ownerId={selectedChat.sellerId}
            onClose={() => {
              setSelectedChat(null);
              fetchChats(); 
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyChats;
