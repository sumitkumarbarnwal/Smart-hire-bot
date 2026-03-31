const https = require("https");

// ─── Groq Configuration ─────────────────────────────────────
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile"; // Llama 3.3 70B on Groq

// ─── Prompts ────────────────────────────────────────────────

const SCORING_PROMPT = `You are an expert ATS (Applicant Tracking System) resume analyst and career coach.

You will receive a Job Description (JD) and a candidate's Resume. Analyze the resume against the JD and provide a detailed evaluation.

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code fences, no explanation text outside the JSON. Do NOT use actual newline characters inside JSON string values — use \\n instead.

Return this exact JSON structure:
{
  "score": <number 1-10>,
  "breakdown": {
    "skillsMatch": { "score": <1-10>, "details": "<explanation>" },
    "experienceRelevance": { "score": <1-10>, "details": "<explanation>" },
    "keywordCoverage": { "score": <1-10>, "details": "<explanation>" },
    "formatting": { "score": <1-10>, "details": "<explanation>" },
    "impactMetrics": { "score": <1-10>, "details": "<explanation>" }
  },
  "missingKeywords": ["<keyword1>", "<keyword2>"],
  "suggestions": [
    "<actionable suggestion 1>",
    "<actionable suggestion 2>",
    "<actionable suggestion 3>"
  ]
}

Scoring Guidelines:
- 9-10: Perfect match, resume is highly optimized for this role
- 7-8: Strong match, minor improvements needed
- 5-6: Moderate match, several areas need improvement
- 3-4: Weak match, significant gaps exist
- 1-2: Poor match, resume needs major overhaul for this role

Be thorough, specific, and actionable in your suggestions.`;

const REWRITE_PROMPT = `You are an expert resume writer and ATS optimization specialist.

You will receive a Job Description (JD), a candidate's Resume, missing keywords, and suggestions. Your task is to rewrite and optimize the resume.

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code fences, no explanation text outside the JSON. Use \\n for newlines inside string values.

CRITICAL: The optimized resume MUST start with the candidate's full name (from the original resume) as the very first line, followed by their contact information (email, phone, LinkedIn, location, etc.) exactly as found in the original resume. Do NOT skip or omit the candidate's name and contact details. If the original resume has a name, it MUST appear at the top.

Return this exact JSON structure:
{
  "optimizedResume": "<The FULL improved resume text starting with the candidate's NAME and CONTACT INFO, then followed by sections: SUMMARY, EXPERIENCE, SKILLS, EDUCATION, PROJECTS. Use \\n for line breaks. Incorporate the missing keywords naturally. Use bullet points for lists. Keep all factual information from the original resume but improve wording, add relevant keywords, quantify achievements where possible, and optimize for ATS. Format cleanly with clear section headings in UPPERCASE.>"
}

The optimized resume should be a complete, ready-to-use version that scores higher on ATS systems.`;

// ─── Groq API Call ──────────────────────────────────────────

/**
 * Call Groq API with the Llama 3.3 70B model
 * @param {string} systemPrompt - System prompt
 * @param {string} userPrompt - User prompt
 * @returns {Promise<string>} Raw response text
 */
function callGroq(systemPrompt, userPrompt) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 8192,
      response_format: { type: "json_object" },
    });

    const url = new URL(GROQ_API_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString();

        if (res.statusCode !== 200) {
          try {
            const errData = JSON.parse(body);
            reject(
              new Error(
                `Groq API error (${res.statusCode}): ${errData.error?.message || body}`
              )
            );
          } catch {
            reject(new Error(`Groq API error (${res.statusCode}): ${body}`));
          }
          return;
        }

        try {
          const data = JSON.parse(body);
          const content = data.choices?.[0]?.message?.content;
          if (!content) {
            reject(new Error("Groq returned empty response"));
            return;
          }
          resolve(content);
        } catch (e) {
          reject(new Error(`Failed to parse Groq response: ${e.message}`));
        }
      });
      res.on("error", reject);
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Parse JSON from AI response, handling code fences and control characters
 */
function parseAIJSON(text) {
  function sanitize(str) {
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, " ");
  }

  let cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  cleaned = sanitize(cleaned);

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`AI returned invalid JSON: ${e.message}`);
  }
}

// ─── Main Analysis Function ─────────────────────────────────

/**
 * Analyze a resume against a job description using Groq AI (Llama 3.3 70B)
 * Step 1: ATS Score + Skill Match + Suggestions
 * Step 2: Resume Rewrite + Optimization
 * @param {string} jobDescription - The job description text
 * @param {string} resumeText - The extracted resume text
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeResume(jobDescription, resumeText) {
  const userInput = `
=== JOB DESCRIPTION ===
${jobDescription}

=== CANDIDATE RESUME ===
${resumeText}`;

  try {
    // ── Step 1: ATS Scoring ──
    console.log(`🔍 Step 1: Scoring with Groq (${MODEL})...`);

    const scoringResponse = await callGroq(
      SCORING_PROMPT,
      `${userInput}\n\nAnalyze this resume against the job description and provide your evaluation as JSON.`
    );

    const scoring = parseAIJSON(scoringResponse);

    if (!scoring.score || !scoring.suggestions) {
      throw new Error("Scoring model returned incomplete response");
    }

    scoring.score = Math.max(1, Math.min(10, Math.round(scoring.score)));

    // ── Step 2: Resume Rewrite ──
    console.log(`📝 Step 2: Rewriting with Groq (${MODEL})...`);

    const rewritePromptInput = `${userInput}

=== ANALYSIS RESULTS ===
Missing Keywords: ${(scoring.missingKeywords || []).join(", ")}
Suggestions: ${(scoring.suggestions || []).join("; ")}

Rewrite and optimize this resume based on the job description and the analysis results above. Return the result as JSON.`;

    const rewriteResponse = await callGroq(
      REWRITE_PROMPT,
      rewritePromptInput
    );

    const rewrite = parseAIJSON(rewriteResponse);

    if (!rewrite.optimizedResume) {
      throw new Error("Rewrite model returned incomplete response");
    }

    // ── Combine results ──
    return {
      score: scoring.score,
      breakdown: scoring.breakdown || {},
      missingKeywords: scoring.missingKeywords || [],
      suggestions: scoring.suggestions || [],
      optimizedResume: rewrite.optimizedResume,
    };
  } catch (err) {
    if (
      err.message.includes("API key") ||
      err.message.includes("401") ||
      err.message.includes("Unauthorized") ||
      err.message.includes("invalid_api_key")
    ) {
      throw new Error(
        "❌ Invalid Groq API key. Please check your GROQ_API_KEY in the .env file."
      );
    }
    if (err.message.includes("429") || err.message.includes("rate")) {
      throw new Error(
        "⏳ Rate limit reached. Groq free tier has limits — please wait a minute and try again."
      );
    }
    throw new Error(`AI analysis failed: ${err.message}`);
  }
}

module.exports = { analyzeResume };
