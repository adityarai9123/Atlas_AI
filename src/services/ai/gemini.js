const { GoogleGenAI } = require("@google/genai");

const financeTools = require("../../tools/financeTools");
const userTools = require("../../tools/userTools");
const briefingTools = require("../../tools/briefingTools");
const documentTools = require("../../tools/documentTools");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const allTools = {
  ...financeTools,
  ...userTools,
  ...briefingTools,
  ...documentTools,
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

      {
        name: "getCompanyFundamentals",
        description: "Get key financial metrics/fundamentals for a publicly traded company (P/E, EPS, market cap, 52-week high/low, revenue growth, net margin, etc.).",
        parameters: {
          type: "OBJECT",
          properties: {
            symbol: {
              type: "STRING",
              description: "Stock ticker symbol (e.g. NVDA, AMD).",
            },
          },
          required: ["symbol"],
        },
      },

      {
        name: "getEarnings",
        description: "Get the recent actual earnings reports and future/next expected earnings date for a publicly traded company.",
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
        name: "getSecFilings",
        description: "Get a list of recent SEC filings (10-K, 10-Q, 8-K) with dates and links for a publicly traded company.",
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
        name: "listDocuments",
        description: "List all PDF documents uploaded by the user.",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },

      {
        name: "getDocumentContent",
        description: "Retrieve the text content of a specific uploaded document by its file name to answer questions about it.",
        parameters: {
          type: "OBJECT",
          properties: {
            fileName: {
              type: "STRING",
              description: "The name of the file to retrieve.",
            },
          },
          required: ["fileName"],
        },
      },

      {
        name: "createAlert",
        description: "Create an alert for a specific stock ticker and threshold percent change (e.g., alert when MSFT moves 5% or more).",
        parameters: {
          type: "OBJECT",
          properties: {
            symbol: {
              type: "STRING",
              description: "Stock ticker symbol.",
            },
            threshold: {
              type: "NUMBER",
              description: "Percentage movement threshold (e.g. 5 for 5%).",
            },
            type: {
              type: "STRING",
              description: "Type of alert. Defaults to 'price_move'. Possible values: 'price_move', 'news', 'filing'.",
            },
          },
          required: ["symbol", "threshold"],
        },
      },

      {
        name: "getAlerts",
        description: "Retrieve a list of the user's active alerts.",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },

      {
        name: "removeAlert",
        description: "Remove/delete an active alert for a specific stock ticker.",
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

const generateText = async (prompt) => {
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });
  return response.text;
};

module.exports = {
  ai,
  GEMINI_MODEL,
  toolDefinitions,
  executeTool,
  generateText,
};
