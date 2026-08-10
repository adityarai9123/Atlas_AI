const IMPORTANT_NEWS_KEYWORDS = [
  "earnings",
  "revenue",
  "profit",
  "guidance",
  "forecast",
  "acquisition",
  "merger",
  "deal",
  "sec",
  "filing",
  "10-k",
  "10-q",
  "8-k",
  "lawsuit",
  "investigation",
  "regulatory",
  "approval",
  "downgrade",
  "upgrade",
  "dividend",
  "buyback",
  "ceo",
  "cfo",
  "partnership",
];

const isImportantNews = (article) => {
  const text = `
    ${article.headline || ""}
    ${article.summary || ""}
  `.toLowerCase();

  return IMPORTANT_NEWS_KEYWORDS.some(
    (keyword) => text.includes(keyword)
  );
};

const hasMeaningfulMarketMove = (
  quote,
  threshold = 5
) => {
  if (
    !quote ||
    typeof quote.changePercent !== "number"
  ) {
    return false;
  }

  return (
    Math.abs(quote.changePercent) >= threshold
  );
};

const shouldSendBriefing = (
  watchlistData,
  threshold = 5
) => {
  if (!watchlistData?.length) {
    return false;
  }

  return watchlistData.some((stock) => {
    if (stock.error) {
      return false;
    }

    if (
      hasMeaningfulMarketMove(
        stock.quote,
        threshold
      )
    ) {
      return true;
    }

    return (stock.news || []).some(
      isImportantNews
    );
  });
};

module.exports = {
  isImportantNews,
  hasMeaningfulMarketMove,
  shouldSendBriefing,
};