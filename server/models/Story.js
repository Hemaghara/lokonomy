const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
  },
  content: {
    type: String,
    required: [true, "Content is required"],
  },
  type: {
    type: String,
    required: [true, "Story type is required"],
    enum: ["News", "Offers", "Promotions", "Events", "Announcements", "Tips"],
  },
  image: {
    type: String,
  },
  media: [{
    url: String,
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    thumbnail: String,
  }],
  district: {
    type: String,
  },
  taluka: {
    type: String,
  },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [72.6, 22.3] },
  },
  locationAddress: {
    type: String,
  },
  author: {
    type: String,
    required: true,
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isHighlighted: {
    type: Boolean,
    default: false,
  },
  highlightCategory: {
    type: String,
    enum: ["Offers", "Gallery", "Events", "Announcements", "Other"],
    default: "Other",
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  views: {
    type: Number,
    default: 0,
  },
  shares: {
    type: Number,
    default: 0,
  },
  commentCount: {
    type: Number,
    default: 0,
  },
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: String,
      userAvatar: String,
      text: String,
      createdAt: { type: Date, default: Date.now },
    }
  ],
  poll: {
    question: String,
    options: [{
      text: String,
      votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    endsAt: Date
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: function() {
      return this.isHighlighted ? null : new Date(Date.now() + 24 * 60 * 60 * 1000);
    },
  },
  scheduledAt: { type: Date, default: null },
  isFeatured: { type: Boolean, default: false },
  actionLink: {
    url: { type: String, trim: true },
    text: { type: String, enum: ["Shop Now", "Learn More", "Get Offer", "Visit Link", "Book Now", "Contact Us", "Download"], default: "Visit Link" }
  },
});

storySchema.index({ location: "2dsphere" });

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Story", storySchema);
