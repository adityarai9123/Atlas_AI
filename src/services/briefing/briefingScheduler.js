const cron = require("node-cron");

const User = require("../../models/User");
const Conversation = require("../../models/Conversation");

const {
  generateResponse,
} = require("../aiService");

const runScheduledBriefings = async (bot) => {
  try {
    const users = await User.find({
      briefingTime: {
        $ne: "",
      },
      onboardingCompleted: true,
    });

    if (!users.length) {
      return;
    }

    const now = new Date();

    // Convert current time to India time.
    const indiaTime = new Intl.DateTimeFormat(
      "en-IN",
      {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
        weekday: "short",
      }
    ).formatToParts(now);

    const parts = {};

    indiaTime.forEach((part) => {
      parts[part.type] = part.value;
    });

    const currentHour = Number(parts.hour);
    const currentMinute = Number(parts.minute);
    const weekday = parts.weekday;

    // Monday-Friday only
    const weekdays = [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
    ];

    if (!weekdays.includes(weekday)) {
      return;
    }

    for (const user of users) {
      try {
        const briefingTime =
          user.briefingTime
            ?.toLowerCase()
            .trim();

        if (!briefingTime) {
          continue;
        }

        // Currently supports examples such as:
        // "Every weekday at 8 AM"
        // "Every weekday at 9 AM"
        // "8 AM"

        const match =
          briefingTime.match(
            /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i
          );

        if (!match) {
          console.log(
            `Unable to parse briefing time for ${user.telegramId}: ${user.briefingTime}`
          );

          continue;
        }

        let targetHour =
          Number(match[1]);

        const targetMinute =
          match[2]
            ? Number(match[2])
            : 0;

        const meridiem =
          match[3].toLowerCase();

        if (
          meridiem === "pm" &&
          targetHour !== 12
        ) {
          targetHour += 12;
        }

        if (
          meridiem === "am" &&
          targetHour === 12
        ) {
          targetHour = 0;
        }

        if (
          currentHour !== targetHour ||
          currentMinute !== targetMinute
        ) {
          continue;
        }

        // Prevent duplicate briefing in the same minute/day.
        if (user.lastBriefingSentAt) {
          const lastSent =
            new Date(
              user.lastBriefingSentAt
            );

          const sameDay =
            lastSent.toLocaleDateString(
              "en-IN",
              {
                timeZone: "Asia/Kolkata",
              }
            ) ===
            now.toLocaleDateString(
              "en-IN",
              {
                timeZone: "Asia/Kolkata",
              }
            );

          if (sameDay) {
            continue;
          }
        }

        console.log(
          `Generating scheduled briefing for ${user.telegramId}`
        );

        const briefingRequest =
          "What should I know about my watchlist today?";

        await Conversation.create({
          telegramId: user.telegramId,
          role: "user",
          content: briefingRequest,
        });

        const history =
          await Conversation.find({
            telegramId:
              user.telegramId,
          })
            .sort({
              createdAt: -1,
            })
            .limit(10)
            .lean();

        history.reverse();

        const messages =
          history.map(
            (message) => ({
              role: message.role,
              content:
                message.content,
            })
          );

        const response =
          await generateResponse(
            messages,
            user
          );

        await Conversation.create({
          telegramId:
            user.telegramId,
          role: "assistant",
          content: response,
        });

        await user.updateOne({
          lastBriefingSentAt: now,
        });

        await bot.telegram.sendMessage(
          user.telegramId,
          response
        );
      } catch (error) {
        console.error(
          `Scheduled briefing failed for ${user.telegramId}:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error(
      "Briefing scheduler error:",
      error.message
    );
  }
};

const startBriefingScheduler = (bot) => {
  cron.schedule(
    "* * * * *",
    async () => {
      await runScheduledBriefings(bot);
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  console.log(
    "Atlas briefing scheduler started"
  );
};

module.exports = {
  startBriefingScheduler,
};