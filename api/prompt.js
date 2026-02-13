import fetch from "node-fetch";

export async function promptHandler(req, res) {
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

  const aiPrompt = `You are an expert web developer and UI/UX designer.. A user received the following AI analysis of their code and has a follow-up question.

## Previous Analysis:
${content}

## User's Question:
${prompt}

## Instructions:
- Answer the user's question directly and concisely
- Reference specific parts of the analysis when relevant
- Provide code examples if requested
- Be practical and actionable
- If the question is unclear, ask for clarification`;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: aiPrompt }],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to get response");
    }

    return res.status(200).json({
      success: true,
      response: data.choices[0].message.content.trim(),
    });
  } catch (err) {
    console.error("Error in prompt API:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
