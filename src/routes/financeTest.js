const express = require("express");

const {
  getQuote,
  getCompanyProfile,
  getCompanyNews,
} = require("../services/finance/financeService");

const {
  buildWatchlistData,
} = require("../services/briefing/briefingService");

const router = express.Router();

router.get("/quote/:symbol", async (req, res) => {
  try {
    const quote = await getQuote(req.params.symbol);

    res.json(quote);
  } catch (error) {
    console.error(
      "Finance API error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      error: "Unable to fetch stock data",
    });
  }
});

router.get("/company/:symbol", async (req, res) => {
  try {
    const profile = await getCompanyProfile(
      req.params.symbol
    );

    res.json(profile);
  } catch (error) {
    console.error(
      "Finance API error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      error: "Unable to fetch company data",
    });
  }
});

router.get("/news/:symbol", async (req, res) => {
  try {
    const today = new Date();

    const to = today.toISOString().split("T")[0];

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 7);

    const from = fromDate
      .toISOString()
      .split("T")[0];

    const { getCompanyNews } = require("../services/finance/financeService");

    const news = await getCompanyNews(
      req.params.symbol,
      from,
      to
    );

    res.json(news);
  } catch (error) {
    console.error(
      "News API error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      error: "Unable to fetch company news",
    });
  }
});

router.get(
  "/watchlist/:telegramId",
  async (req, res) => {
    try {
      const User = require("../models/User");

      const user = await User.findOne({
        telegramId: req.params.telegramId,
      });

      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      const data = await buildWatchlistData(
        user.watchlist
      );

      res.json({
        telegramId: user.telegramId,
        watchlist: user.watchlist,
        data,
      });
    } catch (error) {
      console.error(
        "Watchlist briefing error:",
        error.message
      );

      res.status(500).json({
        error:
          "Unable to build watchlist data",
      });
    }
  }
);

module.exports = router;