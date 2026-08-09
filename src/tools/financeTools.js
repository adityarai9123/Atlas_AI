const {
  getQuote,
  getCompanyProfile,
  getCompanyNews,
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
};

module.exports = financeTools;