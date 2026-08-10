const User = require("../../models/User");

const createAlert = async (telegramId, symbol, threshold, type = "price_move") => {
  const normalizedSymbol = symbol.toUpperCase().trim();
  const user = await User.findOne({ telegramId });

  if (!user) {
    throw new Error("User not found");
  }

  // Remove existing alert for the same symbol/type to prevent duplicates
  user.alerts = user.alerts.filter(
    (alert) => !(alert.symbol === normalizedSymbol && alert.type === type)
  );

  user.alerts.push({
    symbol: normalizedSymbol,
    threshold: Number(threshold),
    type,
    enabled: true,
  });

  await user.save();

  return {
    success: true,
    message: `Alert created successfully for ${normalizedSymbol} when it changes by ${threshold}%.`,
    alerts: user.alerts,
  };
};

const getAlerts = async (telegramId) => {
  const user = await User.findOne({ telegramId });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    alerts: user.alerts.filter((alert) => alert.enabled),
  };
};

const removeAlert = async (telegramId, symbol, type = "price_move") => {
  const normalizedSymbol = symbol.toUpperCase().trim();
  const user = await User.findOne({ telegramId });

  if (!user) {
    throw new Error("User not found");
  }

  const initialCount = user.alerts.length;
  user.alerts = user.alerts.filter(
    (alert) => !(alert.symbol === normalizedSymbol && alert.type === type)
  );

  if (user.alerts.length === initialCount) {
    return {
      success: false,
      message: `No active alert found for ${normalizedSymbol}.`,
      alerts: user.alerts,
    };
  }

  await user.save();

  return {
    success: true,
    message: `Alert for ${normalizedSymbol} has been removed.`,
    alerts: user.alerts,
  };
};

module.exports = {
  createAlert,
  getAlerts,
  removeAlert,
};
