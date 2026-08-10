const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    telegramId: {
      type: String,
      required: true,
      unique: true,
    },

    firstName: {
      type: String,
      default: "",
    },

    username: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      default: "",
    },

    interests: {
      type: [String],
      default: [],
    },

    watchlist: {
      type: [String],
      default: [],
    },

    alertThreshold: {
      type: Number,
      default: 5,
    },
    
    preferredTopics: {
      type: [String],
      default: [],
    },

    briefingTime: {
      type: String,
      default: "",
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    briefingEnabled: {
      type: Boolean,
      default: true,
    },

    lastBriefingSentAt: {
      type: Date,
      default: null,
    },

    onboardingStep: {
      type: String,
      enum: ["role", "interests", "topics", "briefing", "completed"],
      default: "role",
    },

    onboardingCompleted: {
      type: Boolean,
      default: false,
    },

    onboardingStep: {
      type: String,
      default: "role",
    },


  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
