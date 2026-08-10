const cron = require("node-cron");
const mongoose = require("mongoose");

const User = require("../../models/User");
const Conversation = require("../../models/Conversation");

const { buildWatchlistData } = require("./briefingService");

const { shouldSendBriefing } = require("./briefingFilter");

const { generateResponse } = require("../aiService");

const startBriefingScheduler = (bot) => {
  // Check every minute.
  cron.schedule("* * * * *", async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log("MongoDB is not connected. Skipping briefing cycle.");
        return;
      }
    
    try {
      const users = await User.find({
        onboardingCompleted: true,
        briefingEnabled: true,
        briefingTime: {
          $ne: "",
        },
        "watchlist.0": {
          $exists: true,
        },
      });

      for (const user of users) {
        try {
          if (!isUserBriefingDue(user)) {
            continue;
          }

          console.log(`Briefing due for ${user.telegramId}`);

          const watchlistData = await buildWatchlistData(user.watchlist);

          // --------------------------------
          // Noise filtering
          // --------------------------------

          if (!shouldSendBriefing(watchlistData, user.alertThreshold || 5)) {
            console.log(
              `No meaningful updates for ${user.telegramId}. Staying silent.`,
            );

            continue;
          }

          // --------------------------------
          // Generate personalized briefing
          // --------------------------------

          const messages = [
            {
              role: "user",
              content: "What should I know about my watchlist today?",
            },
          ];

          const response = await generateResponse(messages, user);

          // --------------------------------
          // Save briefing
          // --------------------------------

          await Conversation.create({
            telegramId: user.telegramId,
            role: "assistant",
            content: response,
          });

          // --------------------------------
          // Send Telegram message
          // --------------------------------

          await bot.telegram.sendMessage(user.telegramId, response);

          console.log(`Briefing sent to ${user.telegramId}`);
        } catch (error) {
          console.error(
            `Briefing failed for ${user.telegramId}:`,
            error.message,
          );
        }
      }
    } catch (error) {
      console.error("Briefing scheduler error:", error.message);
    }
  });

  // Check alerts every 5 minutes to avoid rate limits
  cron.schedule("*/5 * * * *", async () => {
    if (mongoose.connection.readyState !== 1) {
      console.log("MongoDB is not connected. Skipping alert check.");
      return;
    }

    try {
      console.log("Starting alert check cycle...");
      await checkAndSendAlerts(bot);
    } catch (error) {
      console.error("Alert check scheduler error:", error.message);
    }
  });

  console.log("Atlas briefing scheduler started");
};

// -----------------------------------------
// Check active alerts for all users and
// send notifications if triggered.
// -----------------------------------------

const checkAndSendAlerts = async (bot) => {
  const users = await User.find({
    "alerts.0": { $exists: true },
  });

  for (const user of users) {
    const activeAlerts = user.alerts.filter((a) => a.enabled);
    if (!activeAlerts.length) continue;

    for (const alert of activeAlerts) {
      try {
        // Cooldown: limit notifications to once every 12 hours per alert
        if (
          alert.lastTriggeredAt &&
          Date.now() - new Date(alert.lastTriggeredAt).getTime() <
            12 * 60 * 60 * 1000
        ) {
          continue;
        }

        const symbol = alert.symbol;
        const threshold = alert.threshold;
        const type = alert.type || "price_move";

        if (type === "price_move") {
          const { getQuote } = require("../finance/financeService");
          const quote = await getQuote(symbol);

          if (quote && typeof quote.changePercent === "number") {
            const absChange = Math.abs(quote.changePercent);
            if (absChange >= threshold) {
              const emoji = quote.changePercent >= 0 ? "📈" : "📉";

              const message =
                `🚨 *Alert Triggered for ${symbol}* 🚨\n\n` +
                `${emoji} *${symbol}* has moved *${quote.changePercent.toFixed(
                  2,
                )}%* today, crossing your threshold of *${threshold}%*.\n` +
                `Current Price: *$${quote.price.toFixed(2)}*\n` +
                `Change: *${quote.change.toFixed(2)}* (${quote.changePercent.toFixed(
                  2,
                )}%)`;

              await bot.telegram.sendMessage(user.telegramId, message, {
                parse_mode: "Markdown",
              });
              console.log(
                `Price alert sent to ${user.telegramId} for ${symbol} (${quote.changePercent}%)`,
              );

              alert.lastTriggeredAt = new Date();
              await user.save();
            }
          }
        } else if (type === "filing") {
          const { getSecFilings } = require("../finance/financeService");
          const filings = await getSecFilings(symbol);

          if (filings && filings.length) {
            // Check for filings in the last 24h
            const recentFilings = filings.filter((f) => {
              const filedTime = new Date(f.filedDate).getTime();
              return Date.now() - filedTime < 24 * 60 * 60 * 1000;
            });

            if (recentFilings.length) {
              const filing = recentFilings[0];
              const message =
                `🚨 *SEC Filing Alert for ${symbol}* 🚨\n\n` +
                `📄 New filing *${filing.form}* was filed on *${filing.filedDate}*.\n\n` +
                `🔗 [Filing URL](${filing.filingUrl}) | [Report URL](${filing.reportUrl})`;

              await bot.telegram.sendMessage(user.telegramId, message, {
                parse_mode: "Markdown",
              });
              console.log(
                `Filing alert sent to ${user.telegramId} for ${symbol}`,
              );

              alert.lastTriggeredAt = new Date();
              await user.save();
            }
          }
        } else if (type === "news") {
          const { getCompanyNews } = require("../finance/financeService");
          const news = await getCompanyNews(symbol);

          if (news && news.length) {
            // Check for news in the last 12h
            const recentNews = news.filter((n) => {
              const newsTime = new Date(n.datetime * 1000).getTime();
              return Date.now() - newsTime < 12 * 60 * 60 * 1000;
            });

            if (recentNews.length) {
              const article = recentNews[0];
              const message =
                `🚨 *News Alert for ${symbol}* 🚨\n\n` +
                `📰 *${article.headline}*\n\n` +
                `Source: _${article.source}_\n` +
                `🔗 [Read Article](${article.url})`;

              await bot.telegram.sendMessage(user.telegramId, message, {
                parse_mode: "Markdown",
              });
              console.log(
                `News alert sent to ${user.telegramId} for ${symbol}`,
              );

              alert.lastTriggeredAt = new Date();
              await user.save();
            }
          }
        }
      } catch (err) {
        console.error(
          `Error checking alert for user ${user.telegramId}, alert ${alert.symbol}:`,
          err.message,
        );
      }
    }
  }
};

// -----------------------------------------
// Determine whether a user's briefing
// is due right now.
// -----------------------------------------

const isUserBriefingDue = (user) => {
  if (!user.briefingTime) {
    return false;
  }

  const now = new Date();

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: user.timezone || "Asia/Kolkata",

    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);

  const values = {};

  for (const part of parts) {
    values[part.type] = part.value;
  }

  const weekday = values.weekday;

  const hour = Number(values.hour);

  const minute = Number(values.minute);

  // Only Monday-Friday for now.
  if (!["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday)) {
    return false;
  }

  const briefingText = user.briefingTime.toLowerCase();

  const hourMatch = briefingText.match(/(\d{1,2})\s*(am|pm)/);

  if (!hourMatch) {
    return false;
  }

  let targetHour = Number(hourMatch[1]);

  const meridiem = hourMatch[2];

  if (meridiem === "pm" && targetHour !== 12) {
    targetHour += 12;
  }

  if (meridiem === "am" && targetHour === 12) {
    targetHour = 0;
  }

  return hour === targetHour && minute === 0;
};

module.exports = {
  startBriefingScheduler,
  isUserBriefingDue,
};
