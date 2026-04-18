import { buildSuggestTutorMessages } from "../src/prompts/suggestTutor.js";
import { groqChatCompletions } from "../src/services/groqChat.js";
import { rateLimit } from "../src/services/rateLimit.js";

function tryParseJsonObject(text) {
  if (!text) return null;
  const str = String(text).trim();
  try {
    return JSON.parse(str);
  } catch {}

  // Fallback: extract first {...} block
  const firstBrace = str.indexOf("{");
  const lastBrace = str.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const candidate = str.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }
  return null;
}

function normalizeToLegacyFields(parsed) {
  if (!parsed || typeof parsed !== "object") return null;

  // v2 -> legacy
  if (parsed.version === "v2") {
    const summary_markdown = Array.isArray(parsed.summary_bullets)
      ? parsed.summary_bullets.map((b) => `- ${b}`).join("\n")
      : "";

    const issues_markdown = Array.isArray(parsed.issues)
      ? parsed.issues
          .slice(0, 6)
          .map((it) => {
            const title = it?.title ? `- **${it.title}**` : "- **Issue**";
            const snippet = it?.snippet ? `\n  - Example: \`${it.snippet}\`` : "";
            const why = it?.why_it_matters ? `\n  - Why: ${it.why_it_matters}` : "";
            const steps = Array.isArray(it?.fix_steps)
              ? `\n  - Fix:\n${it.fix_steps
                  .slice(0, 6)
                  .map((s) => `    - ${s}`)
                  .join("\n")}`
              : "";
            return `${title}${snippet}${why}${steps}`;
          })
          .join("\n")
      : "";

    const why_markdown = Array.isArray(parsed.why_bullets)
      ? parsed.why_bullets.map((b) => `- ${b}`).join("\n")
      : "";

    const checklist_markdown = Array.isArray(parsed.checklist)
      ? parsed.checklist.map((b) => `- ${b}`).join("\n")
      : "";

    return {
      summary_markdown,
      issues_markdown,
      improved_html: parsed.improved_html || "",
      improved_css: parsed.improved_css || "",
      why_markdown,
      checklist_markdown,
    };
  }

  // legacy passthrough
  return {
    summary_markdown: parsed.summary_markdown || "",
    issues_markdown: parsed.issues_markdown || "",
    improved_html: parsed.improved_html || "",
    improved_css: parsed.improved_css || "",
    why_markdown: parsed.why_markdown || "",
    checklist_markdown: parsed.checklist_markdown || "",
  };
}

function buildMarkdownFromParsed(parsed) {
  const legacy = normalizeToLegacyFields(parsed);
  if (!legacy) return "";

  const parts = [
    "### WHAT NEEDS IMPROVEMENT (SUMMARY)",
    legacy.summary_markdown || "",
    "",
    "### COMMON BEGINNER ISSUES FOUND",
    legacy.issues_markdown || "",
    "",
    "### WHY THESE CHANGES HELP",
    legacy.why_markdown || "",
  ];
  if (legacy.checklist_markdown) {
    parts.push("", "### QUICK CHECKLIST (YES/NO)", legacy.checklist_markdown);
  }
  return parts.filter(Boolean).join("\n");
}

function extractRetryAfterMs(text) {
  if (!text) return null;
  const m = String(text).match(/try again in\s+(\d+)m(\d+(?:\.\d+)?)s/i);
  if (!m) return null;
  const minutes = Number(m[1]);
  const seconds = Number(m[2]);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
  return Math.max(0, Math.round(minutes * 60_000 + seconds * 1000));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rl = rateLimit(req, { keyPrefix: "suggest", limit: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    res.setHeader("Retry-After", String(Math.ceil(rl.retryAfterMs / 1000)));
    return res.status(429).json({
      success: false,
      error: "Too many requests. Please try again later.",
      retry_after_ms: rl.retryAfterMs,
    });
  }

  const { html, css } = req.body;

  // Input validation
  if (!html || !css) {
    return res.status(400).json({
      success: false,
      error: "Both HTML and CSS content are required",
    });
  }

  if (html.length > 20000 || css.length > 20000) {
    return res.status(400).json({
      success: false,
      error: "HTML or CSS content is too large (max 20,000 characters each)",
    });
  }

  const messages = buildSuggestTutorMessages({ html, css });

  try {
    const { response, text: errorBody, json: data } = await groqChatCompletions({
      model: "llama-3.3-70b-versatile", // Updated to current Groq model (was llama-3.1-70b-versatile)
      messages,
      temperature: 0.3, // Lower temperature for more consistent, focused responses
      max_tokens: 4000, // Ensure enough tokens for detailed analysis
    });

    if (!response.ok) {
      const retryAfterMs =
        extractRetryAfterMs(errorBody) || extractRetryAfterMs(data?.error?.message);
      const isRateLimit =
        response.status === 429 ||
        data?.error?.code === "rate_limit_exceeded" ||
        String(errorBody || "").toLowerCase().includes("rate limit");

      console.error("Groq API Error Details:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });

      if (isRateLimit) {
        res.setHeader(
          "Retry-After",
          String(Math.ceil(((retryAfterMs ?? 60_000) / 1000))),
        );
        return res.status(429).json({
          success: false,
          error:
            "AI is currently rate-limited. Please wait a bit and try again.",
          retry_after_ms: retryAfterMs,
        });
      }

      throw new Error(
        `Groq API error: ${response.status} ${response.statusText} - ${errorBody}`,
      );
    }

    // Extract the AI response content
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response content from AI model");
    }

    const parsed = tryParseJsonObject(aiResponse);
    const parsed_legacy = parsed ? normalizeToLegacyFields(parsed) : null;

    return res.status(200).json({
      success: true,
      analysis: parsed ? buildMarkdownFromParsed(parsed) : aiResponse,
      usage: data.usage, // Include token usage info
      parsed,
      parsed_legacy,
    });
  } catch (err) {
    console.error("Error in suggest API:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
}
