const {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
} = require("../services/watchlist/watchlistService");

const {
  createAlert,
  getAlerts,
  removeAlert,
} = require("../services/alert/alertService");

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

  createAlert: async ({ telegramId, symbol, threshold, type }) => {
    return await createAlert(telegramId, symbol, threshold, type);
  },

  getAlerts: async ({ telegramId }) => {
    return await getAlerts(telegramId);
  },

  removeAlert: async ({ telegramId, symbol }) => {
    return await removeAlert(telegramId, symbol);
  },
};

module.exports = userTools;