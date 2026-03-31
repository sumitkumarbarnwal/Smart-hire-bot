# 🤖 SmartHire Bot

> **AI-Powered Resume Scoring and Optimization on Telegram**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-brightgreen.svg)]()
[![Node](https://img.shields.io/badge/node-18+-green.svg)]()

An intelligent Telegram bot that analyzes resumes against job descriptions using cutting-edge AI technology. Get instant resume scores, receive optimization suggestions, and improve your hiring process.

---

## ✨ Features

### 🎯 Smart Resume Scoring
- **Intelligent Analysis**: Uses AI to score resumes against job descriptions
- **Multiple File Formats**: Supports PDF, DOCX, and text-based resumes
- **Detailed Breakdown**: Get scoring for skills, experience, qualifications, and more

### 🔧 Resume Optimization
- **Smart Rewriting**: AI-powered suggestions to improve your resume
- **Targeted Improvements**: Specific recommendations based on job requirements
- **Quick Turnaround**: Get results in seconds

### 🚀 Powered by Advanced AI
- **Google Gemini API**: Initial analysis and insights
- **Groq Llama 3.3 70B**: Advanced scoring and rewriting
- **Real-time Processing**: Instant feedback on your resume

---

## 📋 Prerequisites

Before you begin, ensure you have the following:

- **Node.js** v18 or later — [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- A **Google Account** (for Gemini API)
- A **Telegram Account**
- A **Groq Account** (free tier available)

---

## 🚀 Quick Start Guide

### Step 1️⃣ Get Your API Keys

#### 🔑 Telegram Bot Token (2 minutes)
1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a name and username (must end in `bot`)
4. BotFather will give you a token: `7123456789:AAHxxxxxxxxxxxxxxxx`
5. Copy this token for Step 3

#### 🔑 Google Gemini API Key (2 minutes)
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select any project or create a new one
5. Copy the API key for Step 3
6. ✅ **No credit card required** — free tier supports ~1000 requests/day

#### 🔑 Groq API Key (2 minutes)
1. Visit [Groq Console](https://console.groq.com)
2. Sign up (free, no credit card needed)
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key for Step 3

### Step 2️⃣ Clone and Setup

```bash
# Clone the project
git clone https://github.com/Pranay921/telegram-bot.git
cd telegram-bot

# Install dependencies
npm install
```

### Step 3️⃣ Configure Environment

```bash
# Create .env file (Windows)
copy .env.example .env

# OR on Mac/Linux
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Telegram Bot Token — Get from @BotFather on Telegram
TELEGRAM_BOT_TOKEN=your_telegram_token_here

# Google Gemini API Key — Get from https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_key_here

# Groq API Key — Get from https://console.groq.com
GROQ_API_KEY=your_groq_key_here
```

### Step 4️⃣ Start the Bot

```bash
# Production mode
npm start

# Development mode (auto-reload)
npm run dev
```

You should see:
```
┌─────────────────────────────────────┐
│       🤖 SmartHire Bot v1.0         │
│     Powered by Advanced AI          │
└─────────────────────────────────────┘
✅ Bot is running! @YourBotName
🔗 Open: https://t.me/YourBotName
```

---

## 💬 How to Use

### On Telegram

#### 1. **Start the Bot**
```
/start
```
Get a welcome message with available commands.

#### 2. **Score a Resume**
```
/analyze
```
Send your resume (PDF/DOCX) and a job description to receive:
- Overall score (0-100)
- Skill match analysis
- Experience alignment
- Qualification review
- Recommendations for improvement

#### 3. **Get Resume Suggestions**
After scoring, the bot will provide:
- ✅ Strengths and how they align with the job
- 🔧 Areas for improvement
- 💡 Specific suggestions to optimize your resume
- 📈 Priority improvements to make

#### 4. **Help**
```
/help
```
View all available commands and usage examples.

---

## 📊 Supported File Formats

| Format | Support | Notes |
|--------|---------|-------|
| **PDF** | ✅ Full | Recommended format |
| **DOCX** | ✅ Full | Microsoft Word documents |
| **TXT** | ✅ Full | Plain text resumes |
| **DOC** | ⚠️ Limited | Convert to DOCX first |

---

## 🏗️ Project Structure

```
smart-hire-bot/
├── src/
│   ├── index.js          # Entry point & bot initialization
│   ├── bot.js            # Telegram bot command handlers
│   ├── analyzer.js       # AI-powered resume analysis
│   ├── parser.js         # PDF/DOCX parsing
│   ├── generator.js      # Score generation logic
│   └── templates.js      # Response message templates
├── .env.example          # Environment variables template
├── package.json          # Dependencies & scripts
└── README.md             # This file
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file with:

```env
# Required
TELEGRAM_BOT_TOKEN=your_token
GEMINI_API_KEY=your_key
GROQ_API_KEY=your_key

# Optional (defaults provided)
API_TIMEOUT=30000
MAX_FILE_SIZE=10485760
```

### Advanced Settings

Edit `src/analyzer.js` to customize:
- Scoring weights for different criteria
- AI model parameters
- Response formatting

---

## 🚨 Troubleshooting

### Bot Not Starting?
```bash
# Check if all env variables are set
cat .env

# Verify Node.js version
node --version  # Should be v18+

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### API Key Errors?
- **Invalid Telegram Token**: Verify with @BotFather
- **Gemini Key Issues**: Check quota at [aistudio.google.com](https://aistudio.google.com)
- **Groq API Error**: Verify key at [console.groq.com](https://console.groq.com)

### File Upload Issues?
- Max file size: 10MB
- Supported formats: PDF, DOCX, TXT
- Ensure file is not corrupted

### Slow Responses?
- Check internet connection
- Verify API rate limits
- Try again after a few seconds

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **grammy** | ^1.35.0 | Telegram bot framework |
| **@google/generative-ai** | ^0.24.0 | Gemini API client |
| **pdf-parse** | ^1.1.1 | PDF parsing |
| **mammoth** | ^1.8.0 | DOCX parsing |
| **pdfkit** | ^0.16.0 | PDF creation |
| **dotenv** | ^16.4.7 | Environment variables |

---

## 👥 Author

**SmartHire Bot** is created and maintained by:
- **Sumit Kumar Barnwal**

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

We welcome contributions! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 💡 Tips for Best Results

✅ **Do's:**
- Upload clear, well-formatted resumes
- Include specific job descriptions
- Update your resume regularly
- Implement suggested improvements

❌ **Don'ts:**
- Don't upload corrupted files
- Don't submit extremely long resumes (20+ pages)
- Don't use uncommon file formats
- Don't abuse the bot (respect API limits)

---

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature request? Open an issue on GitHub:
[Report Issue](https://github.com/Pranay921/telegram-bot/issues)

---

## 📞 Support

Need help? Try:
1. Check [Troubleshooting](#-troubleshooting) section
2. Review the [Quick Start Guide](#-quick-start-guide)
3. Check existing [Issues](https://github.com/Pranay921/telegram-bot/issues)
4. Create a new issue with details

---

## 🎯 Roadmap

Future features in development:

- 📱 WhatsApp bot support
- 💬 Discord bot integration
- 🌐 Web dashboard for analytics
- 📊 Resume templates and examples
- 🔄 Batch resume processing
- 📈 Career progression insights

---

## ⭐ Show Your Support

If SmartHire Bot helped you, please consider:
- ⭐ Starring this repository
- 🐛 Reporting bugs
- 💡 Suggesting improvements
- 📢 Sharing with others

**Happy hiring! 🚀**

---

<div align="center">

**Made with ❤️ by Sumit Kumar Barnwal**

[Report Bug](https://github.com/Pranay921/telegram-bot/issues) • [Request Feature](https://github.com/Pranay921/telegram-bot/issues) • [Documentation](.)

</div>
