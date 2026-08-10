const { Telegraf } = require("telegraf");

const User = require("../models/User");
const Conversation = require("../models/Conversation");

const { generateResponse } = require("../services/aiService");

const {
  extractMemory,
  updateUserMemory,
} = require("../services/memory/memoryService");

const {
  startBriefingScheduler,
} = require("../services/briefing/briefingScheduler");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start(async (ctx) => {
  await ctx.reply(
    `Welcome to Atlas, your AI financial assistant. 📊

You can ask me things like:

• What's NVDA trading at?
• Add TSM to my watchlist.
• What's on my watchlist?
• What's the latest news on Nvidia?
• What should I know about my watchlist?

Commands:

/watchlist — View your watchlist
/briefing — Get your personalized watchlist briefing`
  );
});

bot.command("briefing", async (ctx) => {
  try {
    const telegramId = String(ctx.from.id);

    const firstName =
      ctx.from.first_name || "";

    const username =
      ctx.from.username || "";

    let user = await User.findOne({
      telegramId,
    });

    if (!user) {
      user = await User.create({
        telegramId,
        firstName,
        username,
      });

      console.log(
        `New Atlas user: ${telegramId}`
      );
    }

    const briefingRequest =
      "What should I know about my watchlist today?";

    await Conversation.create({
      telegramId,
      role: "user",
      content: briefingRequest,
    });

    const history = await Conversation.find({
      telegramId,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    history.reverse();

    const messages = history.map(
      (message) => ({
        role: message.role,
        content: message.content,
      })
    );

    const response =
      await generateResponse(
        messages,
        user
      );

    await Conversation.create({
      telegramId,
      role: "assistant",
      content: response,
    });

    await ctx.reply(response);
  } catch (error) {
    console.error(
      "Briefing command error:",
      error
    );

    if (
      error.status === 429 ||
      error.message?.includes("quota") ||
      error.message?.includes(
        "RESOURCE_EXHAUSTED"
      )
    ) {
      await ctx.reply(
        "Atlas is temporarily unable to generate the AI briefing. Please try again shortly."
      );

      return;
    }

    await ctx.reply(
      "I couldn't generate your briefing right now. Please try again."
    );
  }
});

bot.command("watchlist", async (ctx) => {
  try {
    const telegramId = String(
      ctx.from.id
    );

    const user =
      await User.findOne({
        telegramId,
      });

    if (!user || !user.watchlist.length) {
      await ctx.reply(
        "Your watchlist is currently empty."
      );

      return;
    }

    const watchlist =
      user.watchlist
        .map(
          (symbol) => `• ${symbol}`
        )
        .join("\n");

    await ctx.reply(
      `📋 Your Watchlist\n\n${watchlist}`
    );
  } catch (error) {
    console.error(
      "Watchlist command error:",
      error
    );

    await ctx.reply(
      "I couldn't retrieve your watchlist right now."
    );
  }
});

bot.on("text", async (ctx) => {
  try {
    const telegramId = String(ctx.from.id);

    const firstName = ctx.from.first_name || "";
    const username = ctx.from.username || "";

    const userMessage = ctx.message.text;

    // --------------------------------
    // 1. Find or create user
    // --------------------------------

    let user = await User.findOne({ telegramId });

    if (!user) {
      user = await User.create({
        telegramId,
        firstName,
        username,
      });

      console.log(`New Atlas user: ${telegramId}`);
    }

    // --------------------------------
    // 2. Save user message
    // --------------------------------

    await Conversation.create({
      telegramId,
      role: "user",
      content: userMessage,
    });

    // --------------------------------
    // 3. Extract memory only during onboarding
    // --------------------------------

    if (!user.onboardingCompleted) {
      const memory = await extractMemory(userMessage, user);

      console.log("Extracted memory:", memory);

      user = await updateUserMemory(user, memory);
    }

    // --------------------------------
    // 4. Update onboarding state
    // --------------------------------

    if (user.onboardingStep === "role" && user.role) {
      user.onboardingStep = "interests";
    }

    if (
      user.onboardingStep === "interests" &&
      (user.interests.length || user.watchlist.length)
    ) {
      user.onboardingStep = "topics";
    }

    if (user.onboardingStep === "topics" && user.preferredTopics.length) {
      user.onboardingStep = "briefing";
    }

    // --------------------------------
    // 5. Handle skip during onboarding
    // --------------------------------

    const skipWords = [
      "skip",
      "skip this",
      "skip onboarding",
      "later",
      "not now",
    ];

    if (skipWords.includes(userMessage.toLowerCase().trim())) {
      user.onboardingStep = "completed";
      user.onboardingCompleted = true;
    }

    // --------------------------------
    // 6. Complete onboarding
    // --------------------------------

    if (user.onboardingStep === "briefing" && user.briefingTime) {
      user.onboardingStep = "completed";
      user.onboardingCompleted = true;
    }

    await user.save();

    // --------------------------------
    // 7. Get recent conversation history
    // --------------------------------

    const history = await Conversation.find({
      telegramId,
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    history.reverse();

    const messages = history.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    // --------------------------------
    // 8. Generate Atlas response
    // --------------------------------

    const response = await generateResponse(messages, user);

    // --------------------------------
    // 9. Save assistant response
    // --------------------------------

    await Conversation.create({
      telegramId,
      role: "assistant",
      content: response,
    });

    // --------------------------------
    // 10. Send Telegram response
    // --------------------------------

    await ctx.reply(response);
  } catch (error) {
    console.error("Telegram error:", error);

    if (
      error.status === 429 ||
      error.message?.includes("quota") ||
      error.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      await ctx.reply(
        "Atlas is temporarily experiencing high AI service usage. Please try again shortly.",
      );

      return;
    }

    await ctx.reply(
      "I couldn't complete that request right now. Please try again.",
    );
  }
});

const startTelegramBot = async () => {
  await bot.telegram.setMyCommands([
    {
      command: "start",
      description: "Start using Atlas",
    },
    {
      command: "briefing",
      description: "Get your watchlist briefing",
    },
    {
      command: "watchlist",
      description: "View your watchlist",
    },
  ]);

  bot.launch();

  startBriefingScheduler(bot);

  console.log(
    "Atlas Telegram bot started"
  );
};

module.exports = startTelegramBot;
