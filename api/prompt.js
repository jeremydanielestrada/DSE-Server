import { buildFollowupPrompt } from "../src/prompts/promptFollowup.js";
import { groqChatCompletions } from "../src/services/groqChat.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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
    const { response, json } = await groqChatCompletions({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: aiPrompt }],
      max_tokens: 1000,
      temperature: 0.7,
    });

    if (!response.ok) {
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
