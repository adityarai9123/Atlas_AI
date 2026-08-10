const { PDFParse } = require("pdf-parse");

const Document = require("../../models/document");

const MAX_DOCUMENT_CHARS = 100000;

const extractPdfText = async (buffer) => {
  const parser = new PDFParse({
    data: buffer,
  });

  try {
    const result = await parser.getText();

    if (!result.text || !result.text.trim()) {
      throw new Error("Could not extract readable text from this PDF.");
    }

    return result.text.trim();
  } finally {
    await parser.destroy();
  }
};

const saveDocument = async ({ telegramId, fileName, mimeType, buffer }) => {
  const text = await extractPdfText(buffer);

  if (text.length > MAX_DOCUMENT_CHARS) {
    throw new Error("Document is too large to process right now.");
  }

  const document = await Document.create({
    telegramId,
    fileName,
    mimeType,
    text,
  });

  return document;
};

const getLatestDocument = async (telegramId) => {
  return await Document.findOne({
    telegramId,
  }).sort({
    createdAt: -1,
  });
};

const listDocuments = async (telegramId) => {
  return await Document.find({ telegramId })
    .select("fileName createdAt")
    .sort({ createdAt: -1 })
    .lean();
};

const getDocumentContent = async (telegramId, fileName) => {
  let doc = await Document.findOne({
    telegramId,
    fileName: { $regex: new RegExp("^" + fileName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") },
  }).lean();
  
  if (doc) return doc;
  
  doc = await Document.findOne({
    telegramId,
    fileName: { $regex: new RegExp(fileName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), "i") },
  }).lean();

  return doc;
};

module.exports = {
  extractPdfText,
  saveDocument,
  getLatestDocument,
  listDocuments,
  getDocumentContent,
};
