import { buildSuggestTutorMessages } from "../src/prompts/suggestTutor.js";
import { groqChatCompletions } from "../src/services/groqChat.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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
      console.error("Groq API Error Details:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      throw new Error(
        `Groq API error: ${response.status} ${response.statusText} - ${errorBody}`,
      );
    }

    // Extract the AI response content
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response content from AI model");
    }

    return res.status(200).json({
      success: true,
      analysis: aiResponse,
      usage: data.usage, // Include token usage info
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
