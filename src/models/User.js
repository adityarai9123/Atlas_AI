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

    alerts: [
      {
        symbol: { type: String, required: true },
        threshold: { type: Number, required: true },
        type: { type: String, default: "price_move" },
        enabled: { type: Boolean, default: true },
        lastTriggeredAt: { type: Date, default: null },
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
