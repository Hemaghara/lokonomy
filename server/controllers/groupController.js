const Group = require("../models/Group");
const GroupPost = require("../models/GroupPost");
const User = require("../models/User");
const logger = require("../utils/logger");

// Create a group
exports.createGroup = async (req, res) => {
  try {
    const { name, description, type, district, taluka } = req.body;
    if (!name || !description || !district) {
      return res.status(400).json({ success: false, message: "Name, description and district are required" });
    }

    const group = new Group({
      name,
      description,
      type: type || "area",
      district,
      taluka,
      members: [req.user.id],
      createdBy: req.user.id,
    });

    await group.save();
    res.status(201).json({ success: true, group });
  } catch (err) {
    logger.error({ err }, "Error creating group");
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all groups with filters
exports.getGroups = async (req, res) => {
  try {
    const { district, taluka, type } = req.query;
    const filter = {};
    if (district) filter.district = district;
    if (taluka) filter.taluka = taluka;
    if (type) filter.type = type;

    const groups = await Group.find(filter)
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, groups });
  } catch (err) {
    logger.error({ err }, "Error getting groups");
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get details of a group (along with its posts)
exports.getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("createdBy", "name")
      .populate("members", "name influencerBadge");

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Fetch posts in this group
    const posts = await GroupPost.find({ groupId: group._id })
      .populate("author", "name influencerBadge")
      .populate("comments.author", "name influencerBadge")
      .sort({ createdAt: -1 });

    res.json({ success: true, group, posts });
  } catch (err) {
    logger.error({ err }, "Error getting group details");
    res.status(500).json({ success: false, message: err.message });
  }
};

// Join a group
exports.joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    if (group.members.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: "Already a member of this group" });
    }

    group.members.push(req.user.id);
    await group.save();

    res.json({ success: true, message: "Joined group successfully", group });
  } catch (err) {
    logger.error({ err }, "Error joining group");
    res.status(500).json({ success: false, message: err.message });
  }
};

// Leave a group
exports.leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const index = group.members.indexOf(req.user.id);
    if (index === -1) {
      return res.status(400).json({ success: false, message: "Not a member of this group" });
    }

    group.members.splice(index, 1);
    await group.save();

    res.json({ success: true, message: "Left group successfully", group });
  } catch (err) {
    logger.error({ err }, "Error leaving group");
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create a post in a group
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: "Content is required" });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Optional: check if member
    if (!group.members.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: "Must be a member to post" });
    }

    const post = new GroupPost({
      groupId: group._id,
      author: req.user.id,
      content,
      likes: [],
      comments: []
    });

    await post.save();
    
    const populatedPost = await GroupPost.findById(post._id).populate("author", "name influencerBadge");

    res.status(201).json({ success: true, post: populatedPost });
  } catch (err) {
    logger.error({ err }, "Error creating group post");
    res.status(500).json({ success: false, message: err.message });
  }
};

// Like or unlike a post
exports.likePost = async (req, res) => {
  try {
    const post = await GroupPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const index = post.likes.indexOf(req.user.id);
    if (index === -1) {
      post.likes.push(req.user.id);
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    res.json({ success: true, likes: post.likes });
  } catch (err) {
    logger.error({ err }, "Error liking post");
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add comment to post
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: "Comment content is required" });
    }

    const post = await GroupPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const user = await User.findById(req.user.id);

    post.comments.push({
      author: req.user.id,
      authorName: user.name,
      content,
      createdAt: new Date()
    });

    await post.save();

    const updatedPost = await GroupPost.findById(post._id)
      .populate("author", "name influencerBadge")
      .populate("comments.author", "name influencerBadge");

    res.json({ success: true, post: updatedPost });
  } catch (err) {
    logger.error({ err }, "Error adding comment to post");
    res.status(500).json({ success: false, message: err.message });
  }
};
