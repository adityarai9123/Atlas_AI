const axios = require("axios");

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

const finnhub = axios.create({
  baseURL: FINNHUB_BASE_URL,
  timeout: 10000,
  params: {
    token: process.env.FINNHUB_API_KEY,
  },
});

// -----------------------------------------
// Get stock quote
// -----------------------------------------

const getQuote = async (symbol) => {
  const normalizedSymbol = symbol.toUpperCase();

  const response = await finnhub.get("/quote", {
    params: {
      symbol: normalizedSymbol,
    },
  });

  const data = response.data;

  return {
    symbol: normalizedSymbol,
    price: data.c,
    change: data.d,
    changePercent: data.dp,
    high: data.h,
    low: data.l,
    open: data.o,
    previousClose: data.pc,
  };
};

// -----------------------------------------
// Get company profile
// -----------------------------------------

const getCompanyProfile = async (symbol) => {
  const normalizedSymbol = symbol.toUpperCase();

  const response = await finnhub.get("/stock/profile2", {
    params: {
      symbol: normalizedSymbol,
    },
  });

  const data = response.data;

  return {
    symbol: data.ticker,
    name: data.name,
    country: data.country,
    exchange: data.exchange,
    industry: data.finnhubIndustry,
    marketCap: data.marketCapitalization,
    website: data.weburl,
  };
};

// -----------------------------------------
// Get relevant company news
// -----------------------------------------

const getCompanyNews = async (symbol, companyName = "") => {
  const normalizedSymbol = symbol.toUpperCase();

  const today = new Date();

  const to = today.toISOString().split("T")[0];

  const fromDate = new Date();

  fromDate.setDate(fromDate.getDate() - 7);

  const from = fromDate.toISOString().split("T")[0];

  // ---------------------------------------
  // Get news
  // ---------------------------------------

  const response = await finnhub.get("/company-news", {
    params: {
      symbol: normalizedSymbol,
      from,
      to,
    },
  });

  const articles = response.data
    .filter((article) => article.headline)
    .map((article) => ({
      headline: article.headline,
      source: article.source,
      summary: article.summary || "",
      url: article.url,
      datetime: article.datetime,
    }));

  // ---------------------------------------
  // Build search terms
  // ---------------------------------------

  const searchTerms = [normalizedSymbol, companyName]
    .filter(Boolean)
    .map((term) => term.toLowerCase());

  // ---------------------------------------
  // Filter relevant articles
  // ---------------------------------------

  const relevantArticles = articles.filter((article) => {
    const text = `${article.headline} ${article.summary}`.toLowerCase();

    return searchTerms.some((term) => text.includes(term));
  });

  return relevantArticles.slice(0, 5);
};

module.exports = {
  getQuote,
  getCompanyProfile,
  getCompanyNews,
};
