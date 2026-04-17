import { buildFollowupPrompt } from "../src/prompts/promptFollowup.js";
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

  const rl = rateLimit(req, { keyPrefix: "prompt", limit: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    res.setHeader("Retry-After", String(Math.ceil(rl.retryAfterMs / 1000)));
    return res.status(429).json({
      success: false,
      error: "Too many requests. Please try again later.",
      retry_after_ms: rl.retryAfterMs,
    });
  }

  const { prompt, content } = req.body;

  // Input validation
  if (!prompt) {
    return res.status(400).json({
      success: false,
      error: "Prompt is required",
    });
  }

  if (!content) {
    return res.status(400).json({
      success: false,
      error: "No content",
    });
  }

  if (prompt.length > 1000 || content.length > 50000) {
    return res.status(400).json({
      success: false,
      error: "Input too large (prompt: 1000, content: 50000 chars max)",
    });
  }

  const aiPrompt = buildFollowupPrompt({ prompt, content });

  try {
    const { response, text: errorBody, json } = await groqChatCompletions({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: aiPrompt }],
      max_tokens: 1000,
      temperature: 0.7,
    });

    if (!response.ok) {
      const retryAfterMs =
        extractRetryAfterMs(errorBody) || extractRetryAfterMs(json?.error?.message);
      const isRateLimit =
        response.status === 429 ||
        json?.error?.code === "rate_limit_exceeded" ||
        String(errorBody || "").toLowerCase().includes("rate limit");

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

      throw new Error(json?.error?.message || "Failed to get response");
    }

    return res.status(200).json({
      success: true,
      response: json.choices[0].message.content.trim(),
    });
  } catch (err) {
    console.error("Error in prompt API:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
