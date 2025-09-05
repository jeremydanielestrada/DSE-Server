import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { html, css } = req.body;

  const aiPrompt = `Analyze this HTML and CSS code and provide a brief explanation of the main issues, followed by improved code suggestions.

Start with a short analysis of the main UI, accessibility, and design issues you found in the current page. Then provide the improved code.

Format your response like this:

[Brief explanation of issues found - 2-3 sentences about main problems with design, accessibility, or readability]

HTML:
\`\`\`html
[improved HTML code here]
\`\`\`

CSS:
\`\`\`css
[improved CSS code here]
\`\`\`

HTML to analyze:
${html}

CSS to analyze:
${css}

Focus on:
- Identifying main design and accessibility issues
- Providing semantic HTML improvements
- Enhancing CSS for better visual design
- Adding accessibility attributes
- Improving readability and user experience`;

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
          model: "meta-llama/llama-4-maverick-17b-128e-instruct",
          messages: [{ role: "user", content: aiPrompt }],
          temperature: 0.3,
          max_tokens: 2500,
        }),
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
