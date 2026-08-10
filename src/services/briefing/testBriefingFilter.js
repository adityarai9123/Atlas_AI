const {
  shouldSendBriefing,
} = require("./briefingFilter");

// -----------------------------------------
// CASE 1: Significant price movement
// -----------------------------------------

const significantMove = [
  {
    symbol: "NVDA",
    quote: {
      changePercent: 5.8,
    },
    news: [],
  },
];

// -----------------------------------------
// CASE 2: Small movement + irrelevant news
// -----------------------------------------

const quietMarket = [
  {
    symbol: "NVDA",
    quote: {
      changePercent: 0.4,
    },
    news: [
      {
        headline: "Nvidia shares trade quietly",
        summary: "Limited market activity.",
      },
    ],
  },
];

// -----------------------------------------
// CASE 3: Small movement + meaningful news
// -----------------------------------------

const meaningfulNews = [
  {
    symbol: "NVDA",
    quote: {
      changePercent: 0.6,
    },
    news: [
      {
        headline:
          "Nvidia announces major new AI infrastructure partnership",
        summary:
          "The company announced a significant partnership related to AI infrastructure.",
      },
    ],
  },
];

// -----------------------------------------
// CASE 4: Multiple stocks, one significant
// -----------------------------------------

const mixedWatchlist = [
  {
    symbol: "NVDA",
    quote: {
      changePercent: 0.3,
    },
    news: [],
  },
  {
    symbol: "TSM",
    quote: {
      changePercent: 4.7,
    },
    news: [],
  },
];

console.log(
  "Significant move:",
  shouldSendBriefing(significantMove)
);

console.log(
  "Quiet market:",
  shouldSendBriefing(quietMarket)
);

console.log(
  "Meaningful news:",
  shouldSendBriefing(meaningfulNews)
);

console.log(
  "Mixed watchlist:",
  shouldSendBriefing(mixedWatchlist)
);

console.log(
  "5% threshold:",
  shouldSendBriefing(significantMove, 5)
);

console.log(
  "10% threshold:",
  shouldSendBriefing(significantMove, 10)
);