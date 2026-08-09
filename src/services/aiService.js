const {
  ai,
  toolDefinitions,
  executeTool,
} = require("./ai/gemini");

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
`;

const generateResponse = async (messages, user) => {
  const conversation = messages
    .filter((message) => message.role !== "system")
    .map((message) => {
      const speaker =
        message.role === "assistant"
          ? "Atlas"
          : "User";

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
${
    user.interests.length
      ? user.interests.join(", ")
      : "None"
  }

Watchlist:
${
    user.watchlist.length
      ? user.watchlist.join(", ")
      : "Empty"
  }

Preferred topics:
${
    user.preferredTopics.length
      ? user.preferredTopics.join(", ")
      : "None"
  }
`;

  const prompt = `
${SYSTEM_PROMPT}

${userContext}

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

  // Allow Gemini to perform multiple tool rounds if necessary.
  for (let round = 0; round < 3; round++) {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        tools: toolDefinitions,
      },
    });

    const candidate = response.candidates?.[0];

    if (!candidate?.content) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    // Preserve Gemini's response containing the function call.
    contents.push(candidate.content);

    const functionCalls =
      response.functionCalls || [];

    // -----------------------------------------
    // No more tools -> final text response
    // -----------------------------------------

    if (!functionCalls.length) {
      const text = response.text?.trim();

      if (!text) {
        throw new Error(
          "Gemini returned no text response."
        );
      }

      return text;
    }

    // -----------------------------------------
    // Execute requested tools
    // -----------------------------------------

    for (const functionCall of functionCalls) {
      console.log(
        `Tool call: ${functionCall.name}`,
        functionCall.args
      );

      let toolResult;

      try {
        toolResult = await executeTool(
          functionCall.name,
          functionCall.args || {}
        );

        console.log(
          `Tool result: ${functionCall.name}`,
          toolResult
        );
      } catch (error) {
        console.error(
          `Tool ${functionCall.name} failed:`,
          error.message
        );

        toolResult = {
          error:
            "Unable to retrieve the requested financial data.",
        };
      }

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

  throw new Error(
    "Atlas reached the maximum number of tool rounds."
  );
};

module.exports = {
  generateResponse,
};