const { Bot, InputFile, session, InlineKeyboard } = require("grammy");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const { parseResume } = require("./parser");
const { analyzeResume } = require("./analyzer");
const {
  generatePDF,
  generateDOCX,
  generateTXT,
  cleanupTempFiles,
} = require("./generator");
const { TEMPLATES, TEMPLATE_IDS } = require("./templates");

// ─── Bot Setup ──────────────────────────────────────────────

function createBot() {
  const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

  // Session middleware to track user state
  bot.use(
    session({
      initial: () => ({
        step: "idle", // idle | waiting_jd | waiting_resume | choosing_template
        jobDescription: null,
        optimizedResume: null,
        sessionId: null,
      }),
    })
  );

  // ── /start command
  bot.command("start", async (ctx) => {
    ctx.session.step = "idle";
    ctx.session.jobDescription = null;
    ctx.session.optimizedResume = null;

    await ctx.reply(
      `👋 *Welcome to Resume Scorer Bot!*

I'll help you optimize your resume for any job posting using AI.

*Here's how it works:*
1️⃣ Send me a Job Description
2️⃣ Upload your Resume (PDF or DOCX)
3️⃣ Get a score, suggestions & an optimized resume!
4️⃣ Choose a template for your optimized resume!

Use /analyze to start the analysis.
Use /help for more info.`,
      { parse_mode: "Markdown" }
    );
  });

  // ── /help command
  bot.command("help", async (ctx) => {
    const templateList = TEMPLATE_IDS.map(
      (id) => `   ${TEMPLATES[id].name} — ${TEMPLATES[id].description}`
    ).join("\n");

    await ctx.reply(
      `📖 *Resume Scorer Bot — Help*

*Commands:*
/start — Restart the bot
/analyze — Start resume analysis
/cancel — Cancel current operation
/help — Show this message

*Supported Resume Formats:*
📄 PDF (.pdf)
📝 DOCX (.docx)
📃 TXT (.txt)

*What you'll get:*
📊 Score out of 10 with detailed breakdown
💡 Actionable optimization suggestions
📥 Downloadable optimized resume in 3 formats (PDF, DOCX, TXT)

*Available Templates:*
${templateList}

*Tips:*
• Paste the complete JD for best results
• Use a text-based PDF (not scanned images)
• The more detailed the JD, the better the analysis`,
      { parse_mode: "Markdown" }
    );
  });

  // ── /analyze command — start the flow
  bot.command("analyze", async (ctx) => {
    ctx.session.step = "waiting_jd";
    ctx.session.jobDescription = null;
    ctx.session.optimizedResume = null;

    await ctx.reply(
      `📋 *Step 1/2 — Job Description*

Paste the full Job Description below.

_Include requirements, responsibilities, and preferred qualifications for the best analysis._`,
      { parse_mode: "Markdown" }
    );
  });

  // ── /cancel command
  bot.command("cancel", async (ctx) => {
    if (ctx.session.sessionId) {
      cleanupTempFiles(ctx.session.sessionId);
    }
    ctx.session.step = "idle";
    ctx.session.jobDescription = null;
    ctx.session.optimizedResume = null;
    ctx.session.sessionId = null;
    await ctx.reply("❌ Operation cancelled. Use /analyze to start again.");
  });

  // ── Handle template selection (callback queries from inline keyboard)
  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;

    if (!data.startsWith("template_")) {
      await ctx.answerCallbackQuery();
      return;
    }

    const templateId = data.replace("template_", "");

    if (!TEMPLATES[templateId]) {
      await ctx.answerCallbackQuery({ text: "❌ Unknown template" });
      return;
    }

    if (!ctx.session.optimizedResume || ctx.session.step !== "choosing_template") {
      await ctx.answerCallbackQuery({ text: "⚠️ No resume data. Use /analyze first." });
      return;
    }

    await ctx.answerCallbackQuery({ text: `📝 Generating with ${TEMPLATES[templateId].name}...` });

    const statusMsg = await ctx.reply(
      `⏳ Generating your resume with the *${TEMPLATES[templateId].name}* template...`,
      { parse_mode: "Markdown" }
    );

    try {
      const sessionId = ctx.session.sessionId || `${ctx.from.id}_${Date.now()}`;

      // Generate all formats (PDF uses selected template)
      const [pdfPath, docxPath, txtPath] = await Promise.all([
        generatePDF(ctx.session.optimizedResume, sessionId, templateId),
        generateDOCX(ctx.session.optimizedResume, sessionId),
        generateTXT(ctx.session.optimizedResume, sessionId),
      ]);

      // Delete status message
      try {
        await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
      } catch {}

      await ctx.reply(
        `📥 *Your optimized resumes are ready!*\n_Template: ${TEMPLATES[templateId].name}_\n\n_Choose your preferred format:_`,
        { parse_mode: "Markdown" }
      );

      // Send files
      await ctx.replyWithDocument(new InputFile(pdfPath, "Optimized_Resume.pdf"), {
        caption: "📄 PDF Format — Best for job applications",
      });

      await ctx.replyWithDocument(new InputFile(docxPath, "Optimized_Resume.docx"), {
        caption: "📝 DOCX Format — Easy to edit in Word/Google Docs",
      });

      await ctx.replyWithDocument(new InputFile(txtPath, "Optimized_Resume.txt"), {
        caption: "📃 TXT Format — Plain text version",
      });

      // Show option to try another template
      const retryKeyboard = new InlineKeyboard();
      TEMPLATE_IDS.forEach((id) => {
        if (id !== templateId) {
          retryKeyboard.text(TEMPLATES[id].name, `template_${id}`);
        }
      });
      retryKeyboard.row().text("✅ Done", "template_done");

      await ctx.reply(
        "🎨 *Want to try a different template?*\n_Pick another or press Done._",
        { parse_mode: "Markdown", reply_markup: retryKeyboard }
      );

      // Schedule cleanup
      setTimeout(() => cleanupTempFiles(sessionId), 120000);
    } catch (err) {
      console.error("Template generation error:", err);
      try {
        await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
      } catch {}
      await ctx.reply(
        `❌ *Error generating resume:* ${err.message}\n\nTry another template or use /analyze again.`,
        { parse_mode: "Markdown" }
      );
    }
  });

  // ── Handle "Done" button
  bot.callbackQuery("template_done", async (ctx) => {
    await ctx.answerCallbackQuery({ text: "✅ All done!" });
    if (ctx.session.sessionId) {
      cleanupTempFiles(ctx.session.sessionId);
    }
    ctx.session.step = "idle";
    ctx.session.optimizedResume = null;
    ctx.session.jobDescription = null;
    ctx.session.sessionId = null;

    await ctx.reply(
      "✅ *All done!* Use /analyze to score another resume.",
      { parse_mode: "Markdown" }
    );
  });

  // ── Handle text messages (JD input)
  bot.on("message:text", async (ctx) => {
    // Ignore commands (already handled above)
    if (ctx.message.text.startsWith("/")) return;

    if (ctx.session.step === "waiting_jd") {
      const jd = ctx.message.text.trim();

      if (jd.length < 30) {
        await ctx.reply(
          "⚠️ That seems too short for a Job Description. Please paste the full JD text (at least a few sentences)."
        );
        return;
      }

      ctx.session.jobDescription = jd;
      ctx.session.step = "waiting_resume";

      await ctx.reply(
        `✅ *Got the Job Description!*

📄 *Step 2/2 — Upload Your Resume*

Send your resume as a file attachment.
_Supported formats: PDF, DOCX, TXT_`,
        { parse_mode: "Markdown" }
      );
    } else if (ctx.session.step === "waiting_resume") {
      await ctx.reply(
        "📎 Please upload your resume as a *file attachment* (PDF, DOCX, or TXT).\n\n_Don't paste it as text — upload the actual file._",
        { parse_mode: "Markdown" }
      );
    } else if (ctx.session.step === "choosing_template") {
      await ctx.reply(
        "🎨 Please choose a template from the buttons above, or use /cancel to start over."
      );
    } else {
      await ctx.reply(
        "👋 Use /analyze to start scoring your resume against a job description!"
      );
    }
  });

  // ── Handle document uploads (Resume input)
  bot.on("message:document", async (ctx) => {
    if (ctx.session.step !== "waiting_resume") {
      await ctx.reply(
        "💡 Use /analyze first, then paste a Job Description before uploading your resume."
      );
      return;
    }

    const doc = ctx.message.document;
    const fileName = doc.file_name || "resume.pdf";
    const ext = fileName.toLowerCase().split(".").pop();

    // Validate file type
    if (!["pdf", "docx", "txt"].includes(ext)) {
      await ctx.reply(
        `❌ Unsupported file format: *.${ext}*\n\nPlease upload a *PDF*, *DOCX*, or *TXT* file.`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Validate file size (max 10MB)
    if (doc.file_size > 10 * 1024 * 1024) {
      await ctx.reply("❌ File too large. Please upload a file under 10MB.");
      return;
    }

    // Send "analyzing" message
    const statusMsg = await ctx.reply(
      "⏳ *Analyzing your resume...* This usually takes 10-20 seconds.\n\n🔍 Parsing document...",
      { parse_mode: "Markdown" }
    );

    const sessionId = `${ctx.from.id}_${Date.now()}`;
    ctx.session.sessionId = sessionId;

    try {
      // Download the file
      const file = await ctx.getFile();
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
      const buffer = await downloadFile(fileUrl);

      // Update status
      await ctx.api.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        "⏳ *Analyzing your resume...* This usually takes 10-20 seconds.\n\n📄 Document parsed! Running AI analysis...",
        { parse_mode: "Markdown" }
      );

      // Parse the resume
      const resumeText = await parseResume(buffer, fileName);

      // Analyze with Groq AI
      const analysis = await analyzeResume(
        ctx.session.jobDescription,
        resumeText
      );

      // Update status
      await ctx.api.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        "⏳ *Almost done!*\n\n📝 Preparing results...",
        { parse_mode: "Markdown" }
      );

      // ── Format and send the results ──

      // Score visualization
      const stars = "⭐".repeat(analysis.score);
      const emptyStars = "☆".repeat(10 - analysis.score);
      const scoreEmoji =
        analysis.score >= 8
          ? "🟢"
          : analysis.score >= 5
          ? "🟡"
          : "🔴";

      // Breakdown
      const bd = analysis.breakdown || {};
      const breakdownText = [
        `   Skills Match:         ${formatScore(bd.skillsMatch?.score)}`,
        `   Experience:            ${formatScore(bd.experienceRelevance?.score)}`,
        `   Keywords:              ${formatScore(bd.keywordCoverage?.score)}`,
        `   Formatting:            ${formatScore(bd.formatting?.score)}`,
        `   Impact Metrics:      ${formatScore(bd.impactMetrics?.score)}`,
      ].join("\n");

      // Missing keywords
      const missingKw =
        analysis.missingKeywords && analysis.missingKeywords.length > 0
          ? `\n🔑 *Missing Keywords:*\n${analysis.missingKeywords.map((k) => `\`${k}\``).join(", ")}\n`
          : "";

      // Suggestions
      const suggestionsText =
        analysis.suggestions && analysis.suggestions.length > 0
          ? analysis.suggestions
              .map((s, i) => `${i + 1}. ${s}`)
              .join("\n\n")
          : "No specific suggestions — your resume looks great!";

      // Delete the status message
      await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);

      // Send score card
      await ctx.reply(
        `${scoreEmoji} *Resume Analysis Complete!*\n${"━".repeat(28)}

📊 *Overall Score: ${analysis.score}/10*
${stars}${emptyStars}

📈 *Detailed Breakdown:*
${breakdownText}
${missingKw}
💡 *Optimization Suggestions:*

${suggestionsText}`,
        { parse_mode: "Markdown" }
      );

      // ── Store optimized resume and show template selection ──
      ctx.session.optimizedResume = analysis.optimizedResume;
      ctx.session.step = "choosing_template";

      // Build template selection keyboard
      const keyboard = new InlineKeyboard();
      TEMPLATE_IDS.forEach((id, index) => {
        keyboard.text(
          `${TEMPLATES[id].name}`,
          `template_${id}`
        );
        if (index % 2 === 1) keyboard.row(); // 2 buttons per row
      });

      await ctx.reply(
        `🎨 *Choose a Template for your Optimized Resume*\n${"━".repeat(28)}

${TEMPLATE_IDS.map((id) => `${TEMPLATES[id].name} — _${TEMPLATES[id].description}_`).join("\n")}

_Pick a template to generate your resume in PDF, DOCX & TXT:_`,
        { parse_mode: "Markdown", reply_markup: keyboard }
      );
    } catch (err) {
      console.error("Analysis error:", err);

      try {
        await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
      } catch {}

      await ctx.reply(
        `❌ *Error:* ${err.message}\n\nPlease try again with /analyze`,
        { parse_mode: "Markdown" }
      );

      ctx.session.step = "idle";
      ctx.session.jobDescription = null;
      ctx.session.optimizedResume = null;
      cleanupTempFiles(sessionId);
    }
  });

  // ── Handle other message types
  bot.on("message", async (ctx) => {
    if (ctx.session.step === "waiting_resume") {
      await ctx.reply(
        "📎 Please upload your resume as a *file attachment* (not as a photo or compressed).",
        { parse_mode: "Markdown" }
      );
    }
  });

  // ── Error handler
  bot.catch((err) => {
    console.error("Bot error:", err);
  });

  return bot;
}

// ─── Helpers ────────────────────────────────────────────────

function formatScore(score) {
  if (!score) return "N/A";
  const filled = "█".repeat(score);
  const empty = "░".repeat(10 - score);
  return `${filled}${empty} ${score}/10`;
}

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download file: HTTP ${res.statusCode}`));
        return;
      }

      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

module.exports = { createBot };
