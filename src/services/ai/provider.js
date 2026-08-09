const gemini = require("./gemini");

const generateText = async (prompt) => {
  return gemini.generateText(prompt);
};

module.exports = {
  generateText,
};