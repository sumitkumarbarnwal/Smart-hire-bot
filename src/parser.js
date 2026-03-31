const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

/**
 * Parse a PDF buffer and extract text content
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>} Extracted text
 */
async function parsePDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    const text = data.text.trim();
    if (!text || text.length < 20) {
      throw new Error(
        "Could not extract meaningful text from the PDF. It might be a scanned image — please upload a text-based PDF or a DOCX file."
      );
    }
    return text;
  } catch (err) {
    if (err.message.includes("Could not extract")) throw err;
    throw new Error(`Failed to parse PDF: ${err.message}`);
  }
}

/**
 * Parse a DOCX buffer and extract text content
 * @param {Buffer} buffer - DOCX file buffer
 * @returns {Promise<string>} Extracted text
 */
async function parseDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value.trim();
    if (!text || text.length < 20) {
      throw new Error(
        "Could not extract meaningful text from the DOCX file. Please check the file and try again."
      );
    }
    return text;
  } catch (err) {
    if (err.message.includes("Could not extract")) throw err;
    throw new Error(`Failed to parse DOCX: ${err.message}`);
  }
}

/**
 * Auto-detect file type and parse accordingly
 * @param {Buffer} buffer - File buffer
 * @param {string} fileName - Original file name
 * @returns {Promise<string>} Extracted text
 */
async function parseResume(buffer, fileName) {
  const ext = fileName.toLowerCase().split(".").pop();

  switch (ext) {
    case "pdf":
      return parsePDF(buffer);
    case "docx":
      return parseDOCX(buffer);
    case "doc":
      throw new Error(
        "❌ `.doc` format is not supported. Please convert to `.docx` or `.pdf` and try again."
      );
    case "txt":
      return buffer.toString("utf-8").trim();
    default:
      throw new Error(
        `❌ Unsupported file format: .${ext}\nSupported formats: PDF, DOCX, TXT`
      );
  }
}

module.exports = { parsePDF, parseDOCX, parseResume };
