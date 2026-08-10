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

  console.log("Atlas briefing scheduler started");
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
