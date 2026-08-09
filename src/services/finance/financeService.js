const axios = require("axios");

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

const finnhub = axios.create({
  baseURL: FINNHUB_BASE_URL,
  timeout: 10000,
  params: {
    token: process.env.FINNHUB_API_KEY,
  },
});

const getQuote = async (symbol) => {
  const response = await finnhub.get("/quote", {
    params: {
      symbol: symbol.toUpperCase(),
    },
  });

  const data = response.data;

  return {
    symbol: symbol.toUpperCase(),
    price: data.c,
    change: data.d,
    changePercent: data.dp,
    high: data.h,
    low: data.l,
    open: data.o,
    previousClose: data.pc,
  };
};

const getCompanyProfile = async (symbol) => {
  const response = await finnhub.get("/stock/profile2", {
    params: {
      symbol: symbol.toUpperCase(),
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

const getCompanyNews = async (symbol) => {
  const today = new Date();

  const to = today.toISOString().split("T")[0];

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);

  const from = fromDate.toISOString().split("T")[0];

  const response = await finnhub.get("/company-news", {
    params: {
      symbol: symbol.toUpperCase(),
      from,
      to,
    },
  });

  return response.data.slice(0, 5).map((article) => ({
    headline: article.headline,
    source: article.source,
    summary: article.summary,
    url: article.url,
    datetime: article.datetime,
  }));
};

module.exports = {
  getQuote,
  getCompanyProfile,
  getCompanyNews,
};