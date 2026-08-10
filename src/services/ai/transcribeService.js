const { ai, GEMINI_MODEL } = require("./gemini");

const transcribeAudio = async (buffer, mimeType) => {
  const base64Data = buffer.toString("base64");
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType || "audio/ogg",
            },
          },
          {
            text: "Transcribe this audio verbatim. If there is no speech, return an empty string. Output only the transcription, nothing else. Do not add any metadata, notes, formatting, or description.",
          },
        ],
      },
    ],
  });
  return response.text?.trim() || "";
};

module.exports = {
  transcribeAudio,
};
