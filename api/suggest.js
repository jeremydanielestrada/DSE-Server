import { buildSuggestTutorMessages } from "../src/prompts/suggestTutor.js";
import { groqChatCompletions } from "../src/services/groqChat.js";
import { rateLimit } from "../src/services/rateLimit.js";

function tryParseJsonObject(text) {
  if (!text) return null;
  let str = String(text).trim();

  // Remove common wrappers if the model violates "JSON only"
  str = str
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
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

function stripScripts(html) {
  if (!html) return "";
  return String(html).replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );
}

function buildPreviewHtmlDoc({ htmlBody, cssText }) {
  const safeBody = stripScripts(htmlBody || "");
  const safeCss = String(cssText || "");
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    "  <style>",
    "    *{box-sizing:border-box}",
    "    html,body{margin:0;padding:8px;min-height:100%;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}",
    safeCss,
    "  </style>",
    "</head>",
    "<body>",
    safeBody,
    "</body>",
    "</html>",
  ].join("\n");
}

function extractCodeBlocks(text) {
  const str = String(text || "");
  const htmlMatch = str.match(/```html\s*([\s\S]*?)```/i);
  const cssMatch = str.match(/```css\s*([\s\S]*?)```/i);
  return {
    html: htmlMatch?.[1]?.trim() || "",
    css: cssMatch?.[1]?.trim() || "",
  };
}

function getNested(obj, path) {
  if (!obj || typeof obj !== "object") return undefined;
  const keys = String(path).split(".");
  let cur = obj;
  for (const key of keys) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = cur[key];
  }
  return cur;
}

function pickFirstNonEmptyString(obj, paths) {
  for (const path of paths) {
    const value = getNested(obj, path);
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function collectStringValuesDeep(value, out = [], seen = new Set()) {
  if (value == null) return out;
  if (typeof value === "string") {
    out.push(value);
    return out;
  }
  if (typeof value !== "object") return out;
  if (seen.has(value)) return out;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) collectStringValuesDeep(item, out, seen);
    return out;
  }

  for (const v of Object.values(value)) {
    collectStringValuesDeep(v, out, seen);
  }
  return out;
}

function extractCodeBlocksFromObjectText(obj) {
  const chunks = collectStringValuesDeep(obj, []);
  const joined = chunks.join("\n\n");
  return extractCodeBlocks(joined);
}

function buildLegacyFromMaybeMarkdown(aiResponse) {
  const { html: improved_html, css: improved_css } =
    extractCodeBlocks(aiResponse);
  if (!improved_html && !improved_css) return null;
  return {
    summary_markdown: "",
    issues_markdown: "",
    improved_html,
    improved_css,
    why_markdown: "",
    checklist_markdown: "",
  };
}

function normalizeToLegacyFields(parsed) {
  if (!parsed || typeof parsed !== "object") return null;

  const unescapeNewlines = (value) =>
    typeof value === "string" ? value.replace(/\\n/g, "\n") : value;

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
            const snippet = it?.snippet
              ? `\n  - Example: \`${it.snippet}\``
              : "";
            const why = it?.why_it_matters
              ? `\n  - Why: ${it.why_it_matters}`
              : "";
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

    const improved_html = unescapeNewlines(
      pickFirstNonEmptyString(parsed, [
        "improved_html",
        "improvedHtml",
        "html",
        "html_code",
        "suggested_html",
        "after_html",
        "code.html",
      ]),
    );
    const improved_css = unescapeNewlines(
      pickFirstNonEmptyString(parsed, [
        "improved_css",
        "improvedCss",
        "css",
        "css_code",
        "suggested_css",
        "after_css",
        "code.css",
      ]),
    );

    return {
      summary_markdown,
      issues_markdown,
      improved_html: improved_html || "",
      improved_css: improved_css || "",
      why_markdown,
      checklist_markdown,
    };
  }

  // legacy passthrough
  const improved_html = unescapeNewlines(
    pickFirstNonEmptyString(parsed, [
      "improved_html",
      "improvedHtml",
      "html",
      "html_code",
      "suggested_html",
      "after_html",
      "code.html",
    ]),
  );
  const improved_css = unescapeNewlines(
    pickFirstNonEmptyString(parsed, [
      "improved_css",
      "improvedCss",
      "css",
      "css_code",
      "suggested_css",
      "after_css",
      "code.css",
    ]),
  );

  return {
    summary_markdown: parsed.summary_markdown || "",
    issues_markdown: parsed.issues_markdown || "",
    improved_html: improved_html || "",
    improved_css: improved_css || "",
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

  const rl = rateLimit(req, {
    keyPrefix: "suggest",
    limit: 5,
    windowMs: 60_000,
  });
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
    const {
      response,
      text: errorBody,
      json: data,
    } = await groqChatCompletions({
      model: "llama-3.3-70b-versatile", // Updated to current Groq model (was llama-3.1-70b-versatile)
      messages,
      temperature: 0.3, // Lower temperature for more consistent, focused responses
      max_tokens: 4000, // Ensure enough tokens for detailed analysis
    });

    if (!response.ok) {
      const retryAfterMs =
        extractRetryAfterMs(errorBody) ||
        extractRetryAfterMs(data?.error?.message);
      const isRateLimit =
        response.status === 429 ||
        data?.error?.code === "rate_limit_exceeded" ||
        String(errorBody || "")
          .toLowerCase()
          .includes("rate limit");

      console.error("Groq API Error Details:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });

      if (isRateLimit) {
        res.setHeader(
          "Retry-After",
          String(Math.ceil((retryAfterMs ?? 60_000) / 1000)),
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
    let parsed_legacy = parsed ? normalizeToLegacyFields(parsed) : null;

    if (!parsed) {
      // Log a short snippet for debugging JSON failures (never log full user code)
      console.warn("Suggest parse failed: non-JSON response from model", {
        sample: String(aiResponse).slice(0, 500),
      });
      parsed_legacy = buildLegacyFromMaybeMarkdown(aiResponse);
    }

    if (parsed_legacy) {
      const hasHtml = Boolean(
        parsed_legacy.improved_html && parsed_legacy.improved_html.trim(),
      );
      const hasCss = Boolean(
        parsed_legacy.improved_css && parsed_legacy.improved_css.trim(),
      );
      if (!hasHtml && !hasCss) {
        const extracted = parsed
          ? extractCodeBlocksFromObjectText(parsed)
          : extractCodeBlocks(aiResponse);
        if (extracted.html || extracted.css) {
          parsed_legacy = {
            ...parsed_legacy,
            improved_html: extracted.html || "",
            improved_css: extracted.css || "",
          };
        }
      }
    }

    // Enforce v2 safety: ensure preview + code exist even if model omits them
    if (parsed && parsed.version === "v2") {
      if (
        typeof parsed.improved_html !== "string" ||
        !parsed.improved_html.trim()
      ) {
        parsed.improved_html = stripScripts(html).slice(0, 20_000);
      } else {
        parsed.improved_html = stripScripts(parsed.improved_html);
      }

      if (
        typeof parsed.improved_css !== "string" ||
        !parsed.improved_css.trim()
      ) {
        parsed.improved_css = String(css || "").slice(0, 20_000);
      }

      if (
        typeof parsed.preview_html !== "string" ||
        !parsed.preview_html.trim()
      ) {
        parsed.preview_html = buildPreviewHtmlDoc({
          htmlBody: parsed.improved_html,
          cssText: parsed.improved_css,
        });
      } else {
        parsed.preview_html = stripScripts(parsed.preview_html);
      }
    }

    // Safety fallback: if the model returned JSON but omitted code suggestions,
    // fall back to the original extracted code so the UI can still render.
    if (parsed_legacy) {
      const hasHtml = Boolean(
        parsed_legacy.improved_html && parsed_legacy.improved_html.trim(),
      );
      const hasCss = Boolean(
        parsed_legacy.improved_css && parsed_legacy.improved_css.trim(),
      );
      if (!hasHtml && !hasCss) {
        parsed_legacy = {
          ...parsed_legacy,
          improved_html: String(html || "").trim(),
          improved_css: String(css || "").trim(),
          checklist_markdown: [
            parsed_legacy.checklist_markdown,
            "- Note: AI did not return code suggestions; showing extracted code as fallback.",
          ]
            .filter(Boolean)
            .join("\n"),
        };
      }
    }

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
