const {
  getQuote,
  getCompanyProfile,
  getCompanyNews,
  getCompanyFundamentals,
  getEarnings,
  getSecFilings,
} = require("../services/finance/financeService");

const financeTools = {
  getStockQuote: async ({ symbol }) => {
    return await getQuote(symbol);
  },

  getCompanyProfile: async ({ symbol }) => {
    return await getCompanyProfile(symbol);
  },

  getCompanyNews: async ({ symbol }) => {
    return await getCompanyNews(symbol);
  },

  getCompanyFundamentals: async ({ symbol }) => {
    return await getCompanyFundamentals(symbol);
  },

  getEarnings: async ({ symbol }) => {
    return await getEarnings(symbol);
  },

  getSecFilings: async ({ symbol }) => {
    return await getSecFilings(symbol);
  },
};

module.exports = financeTools;