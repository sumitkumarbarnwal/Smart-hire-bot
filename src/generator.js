const PDFDocument = require("pdfkit");
const docx = require("docx");
const fs = require("fs");
const path = require("path");
const { TEMPLATES } = require("./templates");

// Ensure temp directory exists
const TEMP_DIR = path.join(__dirname, "..", "temp");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// ─── PDF Generation ─────────────────────────────────────────

/**
 * Generate a professionally formatted PDF resume
 * @param {string} resumeContent - The optimized resume text
 * @param {string} sessionId - Unique identifier for temp file
 * @param {string} templateId - Template to use (modern, classic, minimal, executive)
 * @returns {Promise<string>} Path to generated PDF file
 */
async function generatePDF(resumeContent, sessionId, templateId = "modern") {
  return new Promise((resolve, reject) => {
    const tmpl = TEMPLATES[templateId] || TEMPLATES.modern;
    const colors = tmpl.colors;
    const fonts = tmpl.fonts;
    const sizes = tmpl.sizes;
    const style = tmpl.style;

    const filePath = path.join(TEMP_DIR, `resume_${sessionId}.pdf`);
    const doc = new PDFDocument({
      size: "A4",
      bufferPages: true,
      margins: { top: 50, bottom: 50, left: 55, right: 55 },
      info: {
        Title: "Optimized Resume",
        Author: "Resume Scorer Bot",
      },
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const sections = parseResumeIntoSections(resumeContent);
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 110;

    let y = 0;

    // ── Top accent bar
    if (style.accentBar) {
      const barColor = style.accentBarColor || colors.primary;
      doc.rect(0, 0, pageWidth, style.accentBarHeight).fill(barColor);
      y = style.accentBarHeight + 20;
    } else {
      y = 30;
    }

    // ── Executive style: dark name block
    if (style.nameBlock) {
      const blockY = style.accentBar ? style.accentBarHeight : 0;
      doc.rect(0, blockY, pageWidth, style.nameBlockHeight).fill(colors.headerBg);
      y = blockY + 15;
    }

    // ── Render sections
    let isFirstLine = true;
    let nameBlockDone = false;

    for (const section of sections) {
      // New page check
      if (y > 700) {
        doc.addPage();
        if (style.accentBar) {
          const barColor = style.accentBarColor || colors.primary;
          doc.rect(0, 0, pageWidth, Math.min(style.accentBarHeight, 4)).fill(barColor);
        }
        y = 30;
      }

      // ── Name line (first non-empty, non-heading line OR first line)
      if (isFirstLine && section.text.trim() && !section.isHeading) {
        isFirstLine = false;

        const nameColor = style.nameBlock ? (colors.nameText || "#FFFFFF") : colors.primary;
        const nameAlign = style.nameAlign || "left";

        doc
          .fontSize(sizes.name)
          .font(fonts.name)
          .fillColor(nameColor)
          .text(section.text, 55, y, {
            width: contentWidth,
            align: nameAlign,
          });

        y += sizes.name + 8;
        continue;
      }

      // ── Contact info (lines right after name, before first heading)
      if (!nameBlockDone && !section.isHeading && !isFirstLine) {
        const contactColor = style.nameBlock ? (colors.contactText || "#CCCCCC") : colors.secondary;
        const contactAlign = style.contactAlign || "left";

        doc
          .fontSize(sizes.contact)
          .font(fonts.body)
          .fillColor(contactColor)
          .text(section.text, 55, y, {
            width: contentWidth,
            align: contactAlign,
          });

        y += sizes.contact + 4;
        continue;
      }

      if (section.isHeading) {
        nameBlockDone = true;
        isFirstLine = false;

        // Make sure we're past the name block
        if (style.nameBlock && y < (style.accentBarHeight || 0) + style.nameBlockHeight + 5) {
          y = (style.accentBarHeight || 0) + style.nameBlockHeight + 15;
        }

        // Section heading
        y += 12;

        doc
          .fontSize(sizes.heading)
          .font(fonts.heading)
          .fillColor(style.nameBlock ? (colors.accent || colors.primary) : colors.primary)
          .text(section.text, 55, y);
        y += sizes.heading + 5;

        // Divider line
        if (style.sectionDivider) {
          doc
            .moveTo(55, y)
            .lineTo(pageWidth - 55, y)
            .strokeColor(colors.divider)
            .lineWidth(1)
            .stroke();
          y += 8;
        } else {
          y += 4;
        }
      } else if (section.isBullet) {
        // Bullet point
        doc
          .fontSize(sizes.body)
          .font(fonts.body)
          .fillColor(colors.dark);

        const bulletText = section.text.replace(/^[•\-\*]\s*/, "");
        const textHeight = doc.heightOfString(bulletText, {
          width: contentWidth - 25,
          lineGap: 2,
        });

        // Bullet marker
        const bulletColor = style.nameBlock ? (colors.accent || colors.primary) : colors.primary;
        if (style.bulletStyle === "circle") {
          doc.circle(65, y + 5, 2).fill(bulletColor);
        } else if (style.bulletStyle === "arrow") {
          doc
            .fontSize(8)
            .font(fonts.body)
            .fillColor(bulletColor)
            .text("▸", 60, y + 1);
        } else {
          doc
            .fontSize(sizes.body)
            .font(fonts.body)
            .fillColor(bulletColor)
            .text("–", 62, y);
        }

        doc
          .fontSize(sizes.body)
          .font(fonts.body)
          .fillColor(colors.dark)
          .text(bulletText, 75, y, {
            width: contentWidth - 25,
            lineGap: 2,
          });

        y += textHeight + 4;
      } else if (section.text.trim()) {
        // Regular text
        doc
          .fontSize(sizes.body)
          .font(fonts.body)
          .fillColor(colors.dark)
          .text(section.text, 55, y, {
            width: contentWidth,
            lineGap: 3,
          });

        y += doc.heightOfString(section.text, { width: contentWidth, lineGap: 3 }) + 4;
      }
    }

    // ── Footer on every page
    const pageRange = doc.bufferedPageRange();
    for (let i = 0; i < pageRange.count; i++) {
      doc.switchToPage(pageRange.start + i);
      doc
        .fontSize(8)
        .fillColor(colors.secondary)
        .text(`Generated by Resume Scorer Bot`, 55, doc.page.height - 35, {
          width: contentWidth,
          align: "center",
        });
    }

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
}

// ─── DOCX Generation ────────────────────────────────────────

/**
 * Generate a professionally formatted DOCX resume
 * @param {string} resumeContent - The optimized resume text
 * @param {string} sessionId - Unique identifier for temp file
 * @returns {Promise<string>} Path to generated DOCX file
 */
async function generateDOCX(resumeContent, sessionId) {
  const filePath = path.join(TEMP_DIR, `resume_${sessionId}.docx`);
  const sections = parseResumeIntoSections(resumeContent);

  const children = [];

  for (const section of sections) {
    if (section.isHeading) {
      // Add spacing before headings
      children.push(
        new docx.Paragraph({
          spacing: { before: 240 },
          children: [],
        })
      );

      children.push(
        new docx.Paragraph({
          heading: docx.HeadingLevel.HEADING_2,
          spacing: { after: 80 },
          border: {
            bottom: {
              color: "1a73e8",
              space: 4,
              style: docx.BorderStyle.SINGLE,
              size: 6,
            },
          },
          children: [
            new docx.TextRun({
              text: section.text,
              bold: true,
              color: "1a73e8",
              size: 26,
              font: "Calibri",
            }),
          ],
        })
      );
    } else if (section.isBullet) {
      const bulletText = section.text.replace(/^[•\-\*]\s*/, "");
      children.push(
        new docx.Paragraph({
          bullet: { level: 0 },
          spacing: { after: 40, line: 276 },
          children: [
            new docx.TextRun({
              text: bulletText,
              size: 21,
              font: "Calibri",
              color: "202124",
            }),
          ],
        })
      );
    } else if (section.text.trim()) {
      children.push(
        new docx.Paragraph({
          spacing: { after: 60, line: 276 },
          children: [
            new docx.TextRun({
              text: section.text,
              size: 21,
              font: "Calibri",
              color: "202124",
            }),
          ],
        })
      );
    }
  }

  const document = new docx.Document({
    creator: "Resume Scorer Bot",
    title: "Optimized Resume",
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 21,
            color: "202124",
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });

  const buffer = await docx.Packer.toBuffer(document);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

// ─── TXT Generation ─────────────────────────────────────────

/**
 * Generate a clean plain text resume
 * @param {string} resumeContent - The optimized resume text
 * @param {string} sessionId - Unique identifier for temp file
 * @returns {Promise<string>} Path to generated TXT file
 */
async function generateTXT(resumeContent, sessionId) {
  const filePath = path.join(TEMP_DIR, `resume_${sessionId}.txt`);

  // Clean up and format
  let formatted = resumeContent
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "  ")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Add a header
  const header = `${"=".repeat(50)}
  OPTIMIZED RESUME
  Generated by Resume Scorer Bot
${"=".repeat(50)}\n\n`;

  fs.writeFileSync(filePath, header + formatted, "utf-8");
  return filePath;
}

// ─── Helpers ────────────────────────────────────────────────

/**
 * Parse resume content into structured sections
 */
function parseResumeIntoSections(text) {
  // Convert literal \n sequences to actual newlines (AI models sometimes return these)
  let cleaned = text.replace(/\\n/g, "\n").replace(/\\t/g, "  ");
  const lines = cleaned.split("\n");
  const sections = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect section headings (ALL CAPS lines or lines with === or ---)
    const isHeading =
      (trimmed === trimmed.toUpperCase() &&
        trimmed.length > 2 &&
        trimmed.length < 60 &&
        /[A-Z]/.test(trimmed) &&
        !/[•\-\*]/.test(trimmed[0])) ||
      /^#{1,3}\s/.test(trimmed) ||
      /^[A-Z][A-Z\s&\/]+:?$/.test(trimmed);

    // Detect bullet points
    const isBullet = /^[•\-\*]\s/.test(trimmed) || /^\d+[\.)\]]\s/.test(trimmed);

    let text = trimmed;
    // Clean markdown headers
    if (/^#{1,3}\s/.test(text)) {
      text = text.replace(/^#{1,3}\s*/, "");
    }

    sections.push({ text, isHeading, isBullet });
  }

  return sections;
}

/**
 * Clean up temp files for a session
 * @param {string} sessionId
 */
function cleanupTempFiles(sessionId) {
  const extensions = [".pdf", ".docx", ".txt"];
  for (const ext of extensions) {
    const filePath = path.join(TEMP_DIR, `resume_${sessionId}${ext}`);
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

module.exports = { generatePDF, generateDOCX, generateTXT, cleanupTempFiles };
