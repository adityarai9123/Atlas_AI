const User = require("../models/User");

const {
  buildWatchlistData,
} = require("../services/briefing/briefingService");

const briefingTools = {
  getWatchlistBriefingData: async ({ telegramId }) => {
    const user = await User.findOne({
      telegramId,
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.watchlist.length) {
      return {
        watchlist: [],
        message: "The user's watchlist is empty.",
      };
    }

    const watchlistData =
      await buildWatchlistData(user.watchlist);

    return {
      profile: {
        role: user.role || "",
        interests: user.interests || [],
        preferredTopics:
          user.preferredTopics || [],
      },

      watchlist: watchlistData,
    };
  },
};

module.exports = briefingTools;