# 🤖 Resume Scorer Bot — Setup Guide

A complete guide to set up the Resume Scorer Bot on **Telegram**, **Discord**, and **WhatsApp**.

---

## 📋 Prerequisites

- **Node.js** v18 or later — [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- A **Google account** (for Gemini API key)
- A **Telegram account** (for the bot)

---

## 🚀 Quick Start (Telegram Bot)

### Step 1: Get Your API Keys

#### 🔑 Telegram Bot Token (2 minutes)

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a **name** for your bot (e.g., `Resume Scorer`)
4. Choose a **username** (must end in `bot`, e.g., `my_resume_scorer_bot`)
5. BotFather will give you a **token** like: `7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxx`
6. **Copy this token** — you'll need it in Step 2

#### 🔑 Google Gemini API Key (2 minutes)

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select any project (or create a new one)
5. **Copy the API key** — you'll need it in Step 2
6. ✅ No credit card required — free tier supports ~1000 requests/day

### Step 2: Configure Environment

```bash
# In the project directory, copy the example env file
cp .env.example .env
```

Edit `.env` and paste your keys:

```env
TELEGRAM_BOT_TOKEN=7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Start the Bot

```bash
npm start
```

You should see:
```
┌─────────────────────────────────────────┐
│       🤖 Resume Scorer Bot v1.0         │
│       Powered by Google Gemini AI       │
└─────────────────────────────────────────┘
⏳ Connecting to Telegram...
✅ Bot is running! @your_bot_username
🔗 Open: https://t.me/your_bot_username
```

### Step 5: Test It!

1. Open the link `https://t.me/your_bot_username` in Telegram
2. Send `/start` to the bot
3. Send `/analyze` to begin
4. Paste a Job Description
5. Upload a resume (PDF or DOCX)
6. Get your score and optimized resume! 🎉

---

## 🟣 Discord Bot Setup

Want to run this on Discord too? Here's how to set up a Discord version:

### Step 1: Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** → Name it `Resume Scorer`
3. Go to the **"Bot"** section in the left sidebar
4. Click **"Add Bot"** → Confirm
5. Under **Token**, click **"Copy"** — save this token
6. Under **Privileged Gateway Intents**, enable:
   - ✅ Message Content Intent
7. Click **"Save Changes"**

### Step 2: Invite the Bot to Your Server

1. Go to **OAuth2 → URL Generator**
2. Select scopes: `bot`, `applications.commands`
3. Select permissions: `Send Messages`, `Attach Files`, `Read Message History`
4. Copy the generated URL and open it in your browser
5. Select your server and authorize

### Step 3: Discord Bot Code (Scaffold)

Create `src/discord-bot.js`:

```javascript
const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
const { parseResume } = require("./parser");
const { analyzeResume } = require("./analyzer");
const { generatePDF, generateDOCX, generateTXT, cleanupTempFiles } = require("./generator");
const https = require("https");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// User sessions
const sessions = new Map();

client.on("ready", () => {
  console.log(`Discord bot ready as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const userId = message.author.id;

  if (message.content === "!analyze") {
    sessions.set(userId, { step: "waiting_jd", jd: null });
    message.reply("📋 **Step 1/2** — Paste the Job Description below:");
    return;
  }

  const session = sessions.get(userId);
  if (!session) return;

  if (session.step === "waiting_jd") {
    session.jd = message.content;
    session.step = "waiting_resume";
    message.reply("✅ Got the JD! **Step 2/2** — Upload your resume (PDF/DOCX)");
    return;
  }

  if (session.step === "waiting_resume" && message.attachments.size > 0) {
    const attachment = message.attachments.first();
    const statusMsg = await message.reply("⏳ Analyzing...");

    try {
      // Download, parse, analyze (same as Telegram flow)
      const buffer = await downloadFile(attachment.url);
      const resumeText = await parseResume(buffer, attachment.name);
      const analysis = await analyzeResume(session.jd, resumeText);

      const sessionId = `discord_${userId}_${Date.now()}`;
      const [pdfPath, docxPath, txtPath] = await Promise.all([
        generatePDF(analysis.optimizedResume, sessionId),
        generateDOCX(analysis.optimizedResume, sessionId),
        generateTXT(analysis.optimizedResume, sessionId),
      ]);

      await statusMsg.edit(`📊 **Score: ${analysis.score}/10**\n\n${analysis.suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}`);
      await message.reply({
        content: "📥 Your optimized resumes:",
        files: [
          new AttachmentBuilder(pdfPath, { name: "Optimized_Resume.pdf" }),
          new AttachmentBuilder(docxPath, { name: "Optimized_Resume.docx" }),
          new AttachmentBuilder(txtPath, { name: "Optimized_Resume.txt" }),
        ],
      });

      setTimeout(() => cleanupTempFiles(sessionId), 60000);
    } catch (err) {
      statusMsg.edit(`❌ Error: ${err.message}`);
    }

    sessions.delete(userId);
  }
});

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

// Add DISCORD_BOT_TOKEN to your .env file
client.login(process.env.DISCORD_BOT_TOKEN);
```

Install Discord.js: `npm install discord.js`

Add to `.env`:
```env
DISCORD_BOT_TOKEN=your_discord_bot_token
```

Run: `node src/discord-bot.js`

---

## 💚 WhatsApp Bot Setup (via Twilio)

> ⚠️ **WhatsApp bots require a Twilio account** (has a free trial with limited credits).

### Step 1: Set Up Twilio

1. Sign up at [Twilio](https://www.twilio.com/try-twilio)
2. Go to **Messaging → Try it out → Send a WhatsApp message**
3. Follow Twilio's sandbox setup (connect your number)
4. Note your **Account SID** and **Auth Token** from the dashboard

### Step 2: WhatsApp Bot Code (Scaffold)

Create `src/whatsapp-bot.js`:

```javascript
const express = require("express");
const twilio = require("twilio");
const { parseResume } = require("./parser");
const { analyzeResume } = require("./analyzer");

const app = express();
app.use(express.urlencoded({ extended: false }));

const sessions = new Map();

app.post("/webhook", async (req, res) => {
  const from = req.body.From;
  const body = req.body.Body || "";
  const mediaUrl = req.body.MediaUrl0;
  
  const twiml = new twilio.twiml.MessagingResponse();
  let session = sessions.get(from) || { step: "idle" };

  if (body.toLowerCase() === "analyze") {
    session = { step: "waiting_jd" };
    sessions.set(from, session);
    twiml.message("📋 Step 1/2: Send the Job Description");
  } else if (session.step === "waiting_jd") {
    session.jd = body;
    session.step = "waiting_resume";
    sessions.set(from, session);
    twiml.message("✅ Got it! Step 2/2: Send your resume (PDF/DOCX)");
  } else if (session.step === "waiting_resume" && mediaUrl) {
    // Download and process the media file
    // ... (similar analysis flow)
    twiml.message("⏳ Analyzing your resume...");
  }

  res.type("text/xml").send(twiml.toString());
});

app.listen(3000, () => console.log("WhatsApp webhook on port 3000"));
```

Install: `npm install express twilio`

### Step 3: Expose with ngrok

```bash
npx ngrok http 3000
```

Copy the ngrok URL and set it as your Twilio webhook:
- Go to Twilio Console → Messaging → WhatsApp Sandbox
- Set webhook URL to: `https://your-ngrok-url.ngrok.io/webhook`

---

## 🛠️ Troubleshooting

| Issue | Fix |
|-------|-----|
| `Missing TELEGRAM_BOT_TOKEN` | Copy `.env.example` to `.env` and add your token |
| `Missing GEMINI_API_KEY` | Get a free key from [AI Studio](https://aistudio.google.com/apikey) |
| `API rate limit reached` | Free tier has limits. Wait 1 minute and retry |
| `Cannot parse PDF` | Make sure it's a text-based PDF, not a scanned image |
| Bot doesn't respond | Check the token is correct, restart with `npm start` |

---

## 📁 Project Structure

```
drcode/
├── src/
│   ├── index.js          # Entry point
│   ├── bot.js            # Telegram bot logic
│   ├── parser.js         # PDF/DOCX text extraction
│   ├── analyzer.js       # Gemini AI analysis engine
│   └── generator.js      # Resume PDF/DOCX/TXT generation
├── temp/                  # Temporary generated files (auto-cleaned)
├── .env                   # Your API keys (not committed)
├── .env.example           # Environment template
├── .gitignore
├── package.json
├── SETUP.md               # This file
└── README.md
```
