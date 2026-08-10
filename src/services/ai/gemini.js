const { GoogleGenAI } = require("@google/genai");

const financeTools = require("../../tools/financeTools");
const userTools = require("../../tools/userTools");
const briefingTools = require("../../tools/briefingTools");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const allTools = {
  ...financeTools,
  ...userTools,
  ...briefingTools,
};

const GEMINI_MODEL = "gemini-3.5-flash";

const toolDefinitions = [
  {
    functionDeclarations: [
      {
        name: "getStockQuote",
        description:
          "Get the latest stock market quote for a publicly traded company.",
        parameters: {
          type: "OBJECT",
          properties: {
            symbol: {
              type: "STRING",
              description:
                "Stock ticker symbol such as NVDA, AMD, AAPL or MSFT.",
            },
          },
          required: ["symbol"],
        },
      },

      {
        name: "getCompanyProfile",
        description: "Get basic information about a publicly traded company.",
        parameters: {
          type: "OBJECT",
          properties: {
            symbol: {
              type: "STRING",
              description: "Stock ticker symbol.",
            },
          },
          required: ["symbol"],
        },
      },

      {
        name: "getCompanyNews",
        description:
          "Get the latest news from the last 7 days about a publicly traded company.",
        parameters: {
          type: "OBJECT",
          properties: {
            symbol: {
              type: "STRING",
              description:
                "Stock ticker symbol, for example NVDA, AMD, AAPL or MSFT.",
            },
          },
          required: ["symbol"],
        },
      },

      {
        name: "addToWatchlist",
        description: "Add a stock ticker to the user's personal watchlist.",
        parameters: {
          type: "OBJECT",
          properties: {
            symbol: {
              type: "STRING",
              description:
                "Stock ticker symbol, such as NVDA, AMD, AAPL or TSM.",
            },
          },
          required: ["symbol"],
        },
      },

      {
        name: "removeFromWatchlist",
        description:
          "Remove a stock ticker from the user's personal watchlist.",
        parameters: {
          type: "OBJECT",
          properties: {
            symbol: {
              type: "STRING",
              description: "Stock ticker symbol.",
            },
          },
          required: ["symbol"],
        },
      },

      {
        name: "getWatchlist",
        description: "Get the user's current personal stock watchlist.",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },

      {
        name: "getWatchlistBriefingData",

        description:
          "Retrieve current market prices and relevant recent news for every company in the user's watchlist. Use this when the user asks for a watchlist briefing, what they should know about their watchlist, important developments in their stocks, or a summary of their watchlist.",

        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
    ],
  },
];

const executeTool = async (name, args, user) => {
  const tool = allTools[name];

  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }

  return await tool({
    ...args,
    telegramId: user.telegramId,
  });
};

module.exports = {
  ai,
  GEMINI_MODEL,
  toolDefinitions,
  executeTool,
};
