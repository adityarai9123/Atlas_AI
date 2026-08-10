const {
  listDocuments,
  getDocumentContent,
} = require("../services/document/documentServices");

const documentTools = {
  listDocuments: async ({ telegramId }) => {
    const docs = await listDocuments(telegramId);
    if (!docs || !docs.length) {
      return {
        documents: [],
        message: "You have not uploaded any documents yet. Please upload a PDF to get started.",
      };
    }
    return {
      documents: docs.map(d => ({
        fileName: d.fileName,
        uploadedAt: d.createdAt,
      })),
    };
  },

  getDocumentContent: async ({ telegramId, fileName }) => {
    const doc = await getDocumentContent(telegramId, fileName);
    if (!doc) {
      return {
        error: `Could not find any document named '${fileName}'. Use listDocuments to see your uploaded files.`,
      };
    }
    return {
      fileName: doc.fileName,
      content: doc.text.slice(0, 100000), // Slice to prevent token limit errors
    };
  },
};

module.exports = documentTools;
