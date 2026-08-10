const { ai, toolDefinitions, executeTool } = require("./ai/gemini");

const { getLatestDocument } = require("./document/documentServices");

const GEMINI_MODEL = "gemini-3.5-flash";

const SYSTEM_PROMPT = `
You are Atlas, an AI-powered financial assistant living inside Telegram.

Your job is to help finance professionals:

- understand financial markets
- research companies
- understand financial information
- summarize financial documents
- track companies and topics they care about
- provide concise and useful insights

Your personality:

- professional
- intelligent
- concise
- conversational
- proactive when appropriate

Important rules:

1. Never invent current financial information.

2. Whenever the user asks for current stock prices,
   daily movements, or recent company information,
   use the appropriate financial tool.

3. Use retrieved financial data as the source of truth.

4. Explain why information matters whenever possible.

5. Use the user's profile and conversation context.

6. Keep responses concise and easy to read on Telegram.

7. If reliable financial information is unavailable,
   clearly communicate the uncertainty.

8. Do not expose internal tool names to the user.

9. Do not mention that you are calling APIs.

10. If a company name is given instead of a ticker,
    infer the ticker when unambiguous.

11. If it is ambiguous, ask a clarification question.

12. When explaining why a stock moved, distinguish
    between verified facts and possible explanations.

13. Never claim that a news event caused a price movement
    unless the retrieved information clearly establishes that.

TOOL USAGE RULES:

- Use only the tools necessary to answer the user's question.
- Do not call the same tool repeatedly with the same arguments.
- For a stock price question, use getStockQuote only.
- For a company overview question, use getCompanyProfile only.
- For a latest-news question, use getCompanyNews only.
- If you already have enough information to answer the user, stop calling tools.
- After receiving useful tool results, synthesize the answer instead of requesting the same data again.

WATCHLIST RULES:

- Users can manage their watchlist using natural language.
- When the user asks to add a stock to their watchlist, use addToWatchlist.
- When the user asks to remove a stock from their watchlist, use removeFromWatchlist.
- When the user asks what is on their watchlist, use getWatchlist.
- Never claim that a stock was added or removed unless the tool confirms it.
- Normalize ticker symbols to uppercase.
- If the company is unambiguous, infer its ticker.
- If the company is ambiguous, ask the user for clarification.


WATCHLIST BRIEFINGS:

When the user asks questions such as:

- "What should I know about my watchlist today?"
- "Give me my watchlist briefing."
- "What's happening with my stocks?"
- "Any important developments in my watchlist?"
- "Summarize my watchlist."

Use getWatchlistBriefingData.

After receiving the data:

1. Do not call individual quote or news tools for the same
   companies unless essential information is missing.

2. Do not repeat getWatchlistBriefingData.

3. Synthesize the retrieved information into a concise
   personalized financial briefing.

4. Include current price and daily percentage movement.

5. Select only the most relevant developments.

6. Use the user's role, interests, and preferred topics
   to prioritize information.

7. Separate verified facts from interpretation.

8. Never claim that news caused a stock movement unless
   the retrieved evidence establishes that relationship.

9. Do not simply dump headlines.

Use a Telegram-friendly structure such as:

📊 Watchlist Briefing

[Stock movements]

🔎 Key Developments

[Important developments]

🎯 What Matters

[Personalized takeaway]

DOCUMENT INTELLIGENCE:

- If the user asks a question about an uploaded document,
  use the document content provided in the context.

- Do not invent information that is not present in the document.

- If the answer cannot be found in the document,
  clearly say that the document does not provide enough information.

- For document summaries, prioritize the most important
  requirements, decisions, risks, deadlines, and action items.

- Keep document answers concise and structured for Telegram.
`;

const generateResponse = async (messages, user, image = null) => {
  const conversation = messages
    .filter((message) => message.role !== "system")
    .map((message) => {
      const speaker = message.role === "assistant" ? "Atlas" : "User";

      return `${speaker}: ${message.content}`;
    })
    .join("\n\n");

  const userContext = `
USER PROFILE

Name:
${user.firstName || "Unknown"}

Role:
${user.role || "Not known"}

Interests:
${user.interests.length ? user.interests.join(", ") : "None"}

Watchlist:
${user.watchlist.length ? user.watchlist.join(", ") : "Empty"}

Preferred topics:
${user.preferredTopics.length ? user.preferredTopics.join(", ") : "None"}
`;

  const latestDocument = await getLatestDocument(user.telegramId);

  const documentText = latestDocument?.text
    ? latestDocument.text.slice(0, 100000)
    : "";

  const documentContext = latestDocument
    ? `
LATEST UPLOADED DOCUMENT

File:
${latestDocument.fileName}

Content:
${documentText}
`
    : "";

  const prompt = `
${SYSTEM_PROMPT}

${userContext}

${documentContext}

RECENT CONVERSATION:

${conversation}

Respond as Atlas.
`;

  let contents = [
    {
      role: "user",
      parts: [
        {
          text: prompt,
        },
      ],
    },
  ];

  if (image && image.buffer && image.mimeType) {
    contents[0].parts.push({
      inlineData: {
        data: image.buffer.toString("base64"),
        mimeType: image.mimeType,
      },
    });
  }

  // Prevent the same tool + arguments
  // from being executed repeatedly.
  const executedTools = new Set();

  // Maximum of two Gemini rounds:
  //
  // Round 1 → Gemini decides whether a tool is needed
  // Round 2 → Gemini receives the tool result and answers
  //
  // This also protects our API quota.
  for (let round = 0; round < 2; round++) {
    console.log(`Gemini round: ${round + 1}`);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        tools: toolDefinitions,
      },
    });

    const candidate = response.candidates?.[0];

    if (!candidate?.content) {
      throw new Error("Gemini returned an empty response.");
    }

    // Preserve Gemini's response.
    // This contains the function call when one exists.
    contents.push(candidate.content);

    const functionCalls = response.functionCalls || [];

    // -----------------------------------------
    // No tool call = final answer
    // -----------------------------------------

    if (!functionCalls.length) {
      const text = response.text?.trim();

      if (!text) {
        throw new Error("Gemini returned no text response.");
      }

      return text;
    }

    // -----------------------------------------
    // Execute requested tools
    // -----------------------------------------

    for (const functionCall of functionCalls) {
      const toolKey = `${functionCall.name}:${JSON.stringify(
        functionCall.args || {},
      )}`;

      // Prevent duplicate tool execution
      if (executedTools.has(toolKey)) {
        console.log(`Skipping duplicate tool call: ${toolKey}`);

        continue;
      }

      executedTools.add(toolKey);

      console.log(`Tool call: ${functionCall.name}`, functionCall.args);

      let toolResult;

      try {
        toolResult = await executeTool(
          functionCall.name,
          functionCall.args || {},
          user,
        );

        console.log(`Tool result: ${functionCall.name}`, toolResult);
      } catch (error) {
        console.error(`Tool ${functionCall.name} failed:`, error.message);

        toolResult = {
          error: "Unable to retrieve the requested financial data.",
        };
      }

      // Send the tool result back to Gemini.
      contents.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name: functionCall.name,
              response: {
                result: toolResult,
              },
              id: functionCall.id,
            },
          },
        ],
      });
    }
  }

  // If Gemini still hasn't produced a final answer
  // after the allowed rounds, fail safely.
  throw new Error("Atlas reached the maximum number of tool rounds.");
};

module.exports = {
  generateResponse,
};
