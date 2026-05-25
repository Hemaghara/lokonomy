import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { groupService } from "../services/groupService";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  MessageSquare,
  Heart,
  Send,
  MapPin,
  Filter,
  LogOut,
  ChevronRight,
  Loader2,
  Trash2,
} from "lucide-react";

const Groups = () => {
  const { user } = useUser();
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [filterTaluka, setFilterTaluka] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newCommentContent, setNewCommentContent] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    description: "",
    type: "area",
    taluka: user?.taluka || "",
  });
  const [submittingGroup, setSubmittingGroup] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [filterTaluka]);

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const district = user?.district || localStorage.getItem("lokonomy_district") || "";
      const params = { district };
      if (filterTaluka) params.taluka = filterTaluka;

      const res = await groupService.getGroups(params);
      if (res.data.success) {
        setGroups(res.data.groups || []);
        if (res.data.groups?.length > 0 && !activeGroup) {
          selectGroup(res.data.groups[0]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load local groups");
    } finally {
      setLoadingGroups(false);
    }
  };

  const selectGroup = async (group) => {
    setActiveGroup(group);
    setLoadingPosts(true);
    try {
      const res = await groupService.getGroupDetails(group._id);
      if (res.data.success) {
        setPosts(res.data.posts || []);
        setActiveGroup(res.data.group);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load group discussions");
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!createFormData.name || !createFormData.description) {
      return toast.error("Please fill in all fields");
    }
    setSubmittingGroup(true);
    try {
      const district = user?.district || localStorage.getItem("lokonomy_district") || "Goa";
      const res = await groupService.createGroup({
        ...createFormData,
        district,
      });
      if (res.data.success) {
        toast.success("Neighborhood group created!");
        setShowCreateModal(false);
        setCreateFormData({ name: "", description: "", type: "area", taluka: user?.taluka || "" });
        fetchGroups();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create group");
    } finally {
      setSubmittingGroup(false);
    }
  };

  const handleJoinLeave = async (group) => {
    if (!user) return toast.error("Please login to join neighborhood groups");
    const isMember = group.members?.includes(user.id);
    try {
      let res;
      if (isMember) {
        res = await groupService.leaveGroup(group._id);
      } else {
        res = await groupService.joinGroup(group._id);
      }
      if (res.data.success) {
        toast.success(isMember ? "Left the group" : "Joined the group!");
        selectGroup(group);
        fetchGroups();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    try {
      const res = await groupService.createPost(activeGroup._id, newPostContent);
      if (res.data.success) {
        setNewPostContent("");
        toast.success("Post shared!");
        selectGroup(activeGroup);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post");
    }
  };

  const handleLikePost = async (postId) => {
    if (!user) return toast.error("Please login to like posts");
    try {
      const res = await groupService.likePost(postId);
      if (res.data.success) {
        selectGroup(activeGroup);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to like post");
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const commentText = newCommentContent[postId];
    if (!commentText || !commentText.trim()) return;

    try {
      const res = await groupService.addComment(postId, commentText);
      if (res.data.success) {
        setNewCommentContent({ ...newCommentContent, [postId]: "" });
        toast.success("Comment added!");
        selectGroup(activeGroup);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to comment");
    }
  };

  const isMemberOfActive = activeGroup?.members?.includes(user?.id);

  return (
    <div className="min-h-screen bg-[#080e1a] text-slate-100 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
        
        <div className="bg-[#111827] border border-[#1f2a3d] rounded-2xl flex flex-col overflow-hidden h-full">
          <div className="p-4 border-b border-[#1f2a3d] flex justify-between items-center bg-[#0d1424]">
            <div>
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                <Users className="text-violet-400 w-5 h-5" /> District Groups
              </h2>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                {user?.district || "Local District"}
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-1.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-white transition-colors"
              title="Create Neighborhood Group"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 border-b border-[#1f2a3d] bg-[#0d1424]/50 flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by Taluka/Town..."
              value={filterTaluka}
              onChange={(e) => setFilterTaluka(e.target.value)}
              className="w-full bg-[#080e1a] border border-[#1f2a3d] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loadingGroups ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                <span className="text-xs text-slate-500">Loading groups...</span>
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No groups found in this area. Create one!
              </div>
            ) : (
              groups.map((group) => (
                <button
                  key={group._id}
                  onClick={() => selectGroup(group)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group ${
                    activeGroup?._id === group._id
                      ? "bg-violet-600/10 border-violet-500/40 text-white"
                      : "bg-[#0d1424] border-[#1f2a3d] text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="font-bold text-xs truncate group-hover:text-violet-400 transition-colors">
                      {group.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1 truncate">
                      {group.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[9px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        👥 {group.members?.length || 0}
                      </span>
                      <span>📍 {group.taluka || "All Talukas"}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-[#111827] border border-[#1f2a3d] rounded-2xl flex flex-col overflow-hidden h-full">
          {activeGroup ? (
            <>
              <div className="p-4 border-b border-[#1f2a3d] bg-[#0d1424] flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold text-base">{activeGroup.name}</h3>
                    <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded text-[9px] uppercase font-bold tracking-wider">
                      {activeGroup.type}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">{activeGroup.description}</p>
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3 h-3 text-rose-400" /> {activeGroup.district} {activeGroup.taluka ? `· ${activeGroup.taluka}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleJoinLeave(activeGroup)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all border shrink-0 ${
                    isMemberOfActive
                      ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 hover:border-red-500/40"
                      : "bg-violet-600 hover:bg-violet-500 text-white border-transparent"
                  }`}
                >
                  {isMemberOfActive ? "Leave Group" : "Join Group"}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {isMemberOfActive ? (
                  <form onSubmit={handleCreatePost} className="bg-[#0d1424] border border-[#1f2a3d] rounded-2xl p-4">
                    <textarea
                      placeholder="Share an update, request help, or start a discussion in this neighborhood group..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="w-full bg-[#080e1a] border border-[#1f2a3d] rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-violet-500 transition-colors resize-none h-20"
                      required
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" /> Post Update
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-[#0d1424]/50 border border-[#1f2a3d] rounded-2xl p-4 text-center text-slate-500 text-xs">
                    You must be a member of this group to post updates or join the discussion.
                  </div>
                )}

                {loadingPosts ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                    <span className="text-xs text-slate-500">Loading discussions...</span>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-16 text-slate-600 text-xs">
                    No discussions yet. Start the conversation!
                  </div>
                ) : (
                  posts.map((post) => {
                    const hasLiked = post.likes?.includes(user?.id);
                    return (
                      <div key={post._id} className="bg-[#0d1424] border border-[#1f2a3d] rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-xs">
                              {post.authorName?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <p className="text-slate-200 font-semibold text-xs">{post.authorName || "Member"}</p>
                              <p className="text-[9px] text-slate-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>

                        <p className="text-slate-300 text-xs leading-relaxed">{post.content}</p>

                        <div className="flex items-center gap-4 pt-2 border-t border-[#1f2a3d]/50 text-[11px] text-slate-400">
                          <button
                            type="button"
                            onClick={() => handleLikePost(post._id)}
                            className={`flex items-center gap-1.5 hover:text-violet-400 transition-colors ${
                              hasLiked ? "text-violet-400 font-bold" : ""
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${hasLiked ? "fill-violet-500 text-violet-400" : ""}`} />
                            {post.likes?.length || 0} Likes
                          </button>
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {post.comments?.length || 0} Comments
                          </span>
                        </div>

                        {post.comments?.length > 0 && (
                          <div className="bg-[#080e1a]/80 rounded-xl p-3 space-y-2 border border-[#1f2a3d]/60 mt-3">
                            {post.comments.map((comment, cIdx) => (
                              <div key={cIdx} className="text-xs border-b border-[#1f2a3d]/20 pb-2 last:border-0 last:pb-0">
                                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                                  <span className="text-slate-400 font-bold">{comment.authorName}</span>
                                  <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-slate-300 mt-1 pl-1">{comment.content}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {isMemberOfActive && (
                          <form
                            onSubmit={(e) => handleAddComment(e, post._id)}
                            className="flex items-center gap-2 mt-2 pt-2 border-t border-[#1f2a3d]/30"
                          >
                            <input
                              type="text"
                              placeholder="Write a comment..."
                              value={newCommentContent[post._id] || ""}
                              onChange={(e) =>
                                setNewCommentContent({
                                  ...newCommentContent,
                                  [post._id]: e.target.value,
                                })
                              }
                              className="flex-1 bg-[#080e1a] border border-[#1f2a3d] rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-500 transition-colors"
                              required
                            />
                            <button
                              type="submit"
                              className="p-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 py-20 text-center px-6">
              <div className="w-20 h-20 bg-violet-600/10 border border-violet-500/20 rounded-3xl flex items-center justify-center text-violet-400 mb-4 animate-pulse">
                <Users size={40} />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Select a Neighborhood Group</h3>
              <p className="text-slate-500 text-sm max-w-sm">
                Choose a group from the list to join local discussions, request items, or connect with neighbors.
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111827] border border-[#1f2a3d] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-[#1f2a3d] pb-3">
                <h3 className="text-white font-bold text-base flex items-center gap-2">
                  <Plus className="text-violet-400" /> Create Neighborhood Group
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-500 hover:text-white text-lg font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider mb-1.5">
                    Group Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mapusa Bakers Union, Panaji Interest Forum"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    className="w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    required
                    placeholder="What is this group about? Who should join?"
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                    className="w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-violet-500 transition-colors h-24 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider mb-1.5">
                      Group Type
                    </label>
                    <select
                      value={createFormData.type}
                      onChange={(e) => setCreateFormData({ ...createFormData, type: e.target.value })}
                      className="w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-violet-500 transition-colors"
                    >
                      <option value="area">Area Forum</option>
                      <option value="interest">Interest Group</option>
                      <option value="business_association">Business Association</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider mb-1.5">
                      Taluka/Town
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mapusa, Panaji"
                      value={createFormData.taluka}
                      onChange={(e) => setCreateFormData({ ...createFormData, taluka: e.target.value })}
                      className="w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1f2a3d] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-[#1a2540] border border-[#1f2a3d] rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#233359] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingGroup}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    {submittingGroup && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Create Group
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Groups;
