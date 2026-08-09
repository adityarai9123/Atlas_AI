const {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
} = require("../services/watchlist/watchlistService");

const userTools = {
  addToWatchlist: async ({ telegramId, symbol }) => {
    return await addToWatchlist(
      telegramId,
      symbol
    );
  },

  removeFromWatchlist: async ({ telegramId, symbol }) => {
    return await removeFromWatchlist(
      telegramId,
      symbol
    );
  },

  getWatchlist: async ({ telegramId }) => {
    return await getWatchlist(telegramId);
  },
};

module.exports = userTools;