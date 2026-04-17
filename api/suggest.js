import { buildSuggestTutorMessages } from "../src/prompts/suggestTutor.js";
import { groqChatCompletions } from "../src/services/groqChat.js";
import { rateLimit } from "../src/services/rateLimit.js";

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

    let parsed = null;
    try {
      const matches = [...aiResponse.matchAll(/```json\\s*([\\s\\S]*?)```/gi)];
      const last = matches[matches.length - 1];
      if (last?.[1]) {
        parsed = JSON.parse(last[1]);
      }
    } catch {
      parsed = null;
    }

    return res.status(200).json({
      success: true,
      analysis: aiResponse,
      usage: data.usage, // Include token usage info
      parsed,
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
