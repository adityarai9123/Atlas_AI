const User = require("../../models/User");

const addToWatchlist = async (telegramId, symbol) => {
  const normalizedSymbol = symbol.toUpperCase().trim();

  const user = await User.findOne({ telegramId });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.watchlist.includes(normalizedSymbol)) {
    return {
      success: false,
      message: `${normalizedSymbol} is already on your watchlist.`,
      watchlist: user.watchlist,
    };
  }

  user.watchlist.push(normalizedSymbol);

  await user.save();

  return {
    success: true,
    message: `${normalizedSymbol} has been added to your watchlist.`,
    watchlist: user.watchlist,
  };
};

const removeFromWatchlist = async (telegramId, symbol) => {
  const normalizedSymbol = symbol.toUpperCase().trim();

  const user = await User.findOne({ telegramId });

  if (!user) {
    throw new Error("User not found");
  }

  const index = user.watchlist.indexOf(normalizedSymbol);

  if (index === -1) {
    return {
      success: false,
      message: `${normalizedSymbol} is not currently on your watchlist.`,
      watchlist: user.watchlist,
    };
  }

  user.watchlist.splice(index, 1);

  await user.save();

  return {
    success: true,
    message: `${normalizedSymbol} has been removed from your watchlist.`,
    watchlist: user.watchlist,
  };
};

const getWatchlist = async (telegramId) => {
  const user = await User.findOne({ telegramId });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    watchlist: user.watchlist,
  };
};

module.exports = {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
};