const { generateText } = require("../ai/provider");

const extractMemory = async (userMessage, user) => {
  const prompt = `
You are Atlas's memory extraction system.

Your job is to identify durable user preferences from the user's latest message.

Current user profile:

Role:
${user.role || "Unknown"}

Interests:
${user.interests.length ? user.interests.join(", ") : "None"}

Watchlist:
${user.watchlist.length ? user.watchlist.join(", ") : "None"}

Preferred topics:
${
  user.preferredTopics.length
    ? user.preferredTopics.join(", ")
    : "None"
}

Briefing time:
${user.briefingTime || "Unknown"}

Current onboarding step:
${user.onboardingStep}

Latest user message:
"${userMessage}"

Return ONLY valid JSON in exactly this structure:

{
  "role": null,
  "interests": [],
  "watchlist": [],
  "preferredTopics": [],
  "briefingTime": null
}

Rules:

1. Only extract information explicitly stated or strongly implied by the user.
2. Do not invent information.
3. If a field has no new information, return null for strings and [] for arrays.
4. If the user mentions companies they actively follow, track, monitor, or want to keep on their radar, put them in watchlist.
5. If the user mentions industries or sectors they care about, put them in interests.
6. If the user mentions financial information they prefer, put it in preferredTopics.
7. Do not put ordinary conversation into memory.
8. Preserve existing information conceptually; only return NEW information from this message.
9. For company names in watchlist, prefer ticker symbols when obvious.
`;

  try {
    const result = await generateText(prompt);

    const cleaned = result
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Memory extraction error:", error.message);

    return {
      role: null,
      interests: [],
      watchlist: [],
      preferredTopics: [],
      briefingTime: null,
    };
  }
};

const updateUserMemory = async (user, memory) => {
  if (memory.role) {
    user.role = memory.role;
  }

  if (memory.interests?.length) {
    user.interests = [
      ...new Set([
        ...user.interests,
        ...memory.interests,
      ]),
    ];
  }

  if (memory.watchlist?.length) {
    user.watchlist = [
      ...new Set([
        ...user.watchlist,
        ...memory.watchlist,
      ]),
    ];
  }

  if (memory.preferredTopics?.length) {
    user.preferredTopics = [
      ...new Set([
        ...user.preferredTopics,
        ...memory.preferredTopics,
      ]),
    ];
  }

  if (memory.briefingTime) {
    user.briefingTime = memory.briefingTime;
  }

  await user.save();

  return user;
};

module.exports = {
  extractMemory,
  updateUserMemory,
};