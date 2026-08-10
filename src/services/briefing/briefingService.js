const {
  getQuote,
  getCompanyProfile,
  getCompanyNews,
} = require("../finance/financeService");

const buildWatchlistData = async (watchlist) => {
  const results = await Promise.all(
    watchlist.map(async (symbol) => {
      try {
        const [quote, profile] =
          await Promise.all([
            getQuote(symbol),
            getCompanyProfile(symbol),
          ]);

        const news = await getCompanyNews(
          symbol,
          profile.name
        );

        return {
          symbol,
          company: profile.name,
          quote,
          news,
        };
      } catch (error) {
        console.error(
          `Failed to build data for ${symbol}:`,
          error.status,
          error.message
        );

        return {
          symbol,
          error:
            "Unable to retrieve market data.",
        };
      }
    })
  );

  return results;
};

module.exports = {
  buildWatchlistData,
};