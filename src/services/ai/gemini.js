const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const GEMINI_MODEL = "gemini-3.5-flash";

const financeTools = require("../../tools/financeTools");

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
    ],
  },
];

const executeTool = async (name, args) => {
  const tool = financeTools[name];

  if (!tool) {
    throw new Error(`Unknown finance tool: ${name}`);
  }

  return await tool(args);
};

module.exports = {
  ai,
  GEMINI_MODEL,
  toolDefinitions,
  executeTool,
};
