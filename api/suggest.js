import fetch from "node-fetch";

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

  const aiPrompt = `You are a beginner-friendly web design tutor helping students who are learning HTML and CSS.
Your goal is to explain mistakes clearly, gently, and in simple terms.
Do NOT assume professional-level knowledge.
Do NOT use advanced jargon unless explained briefly.

Focus on helping students understand *why* something is wrong and *how* to improve it, step by step.

## LEARNING CONTEXT:
- Target users are beginner students learning HTML and CSS
- This is a learning support tool, not a professional developer tool
- Keep explanations short, clear, and educational, but provide enough detail for beginners

## ANALYSIS GUIDELINES:
Analyze the code based on:
1. **Layout & Alignment** – spacing, positioning, consistency
2. **HTML Structure** – correct and meaningful use of tags
3. **CSS Styling** – repeated rules, readability, consistency
4. **Basic Accessibility** – readable text, color contrast, labels
5. **Beginner Best Practices** – simple improvements students can apply

Avoid advanced optimizations unless necessary.

## RESPONSE FORMAT:

### WHAT NEEDS IMPROVEMENT (SUMMARY)
- Provide 4–5 sentences summarizing the main problems.
- Mention issues with layout, HTML structure, CSS readability, or accessibility.

### COMMON BEGINNER ISSUES FOUND
- List 3–5 specific issues.
- For each issue, explain clearly:
  1. What is wrong
  2. Why it is a problem
  3. How the student can fix it (step by step if possible)

### SUGGESTED IMPROVEMENTS

**HTML Suggestions:**
\`\`\`html
[Improved HTML with inline comments explaining changes]
\`\`\`

**CSS Suggestions:**
\`\`\`css
[Improved CSS with comments explaining structure, naming, and readability]
\`\`\`

### WHY THESE CHANGES HELP
- Explain how these improvements make the page more readable, maintainable, and beginner-friendly.
- Use simple, encouraging language.

---

## STUDENT CODE TO ANALYZE:

**HTML:**
${html}

**CSS:**
${css}

## IMPORTANT REMINDERS:
- Use simple, beginner-friendly language
- Explain the reasoning behind each suggestion clearly
- Focus on learning, not perfection
- Encourage improvement and experimentation
- Include helpful comments inside code where appropriate`;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", // Updated to current Groq model (was llama-3.1-70b-versatile)
          messages: [{ role: "user", content: aiPrompt }],
          temperature: 0.3, // Lower temperature for more consistent, focused responses
          max_tokens: 4000, // Ensure enough tokens for detailed analysis
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Groq API Error Details:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      throw new Error(
        `Groq API error: ${response.status} ${response.statusText} - ${errorBody}`,
      );
    }

    const data = await response.json();

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
