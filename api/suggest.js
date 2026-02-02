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

  const aiPrompt = `You are an expert web developer and UI/UX designer. Analyze the provided HTML and CSS code comprehensively and provide detailed, actionable improvements.

## Analysis Framework:
Evaluate the code across these dimensions:
1. **Semantic HTML & Structure** - Proper element usage, document outline, markup quality
2. **Accessibility (WCAG 2.1)** - Screen reader support, keyboard navigation, color contrast, ARIA attributes
3. **Modern CSS Practices** - Flexbox/Grid usage, responsive design, CSS custom properties
4. **Performance** - Code efficiency, loading optimization, best practices
5. **User Experience** - Visual hierarchy, readability, interaction patterns
6. **Cross-browser Compatibility** - Modern standards compliance
7. **Color Theory & Palette** - Analyze existing colors, extract palette, suggest harmonious improvements

## Response Format:
### 🎨 **COLOR PALETTE ANALYSIS**
**Detected Colors:**
[List all colors found in the code with their usage context - e.g., "#FF0000 (background)", "lime (headings)", etc.]

**Color Harmony Assessment:**
[Evaluate if colors work well together, identify clashes, assess overall aesthetic]

**Recommended Palette:**
[Based on the detected colors, suggest an improved but related palette that:
- Maintains the design intent and brand feel
- Ensures WCAG AA contrast ratios (4.5:1 for text, 3:1 for UI components)
- Creates visual harmony using color theory principles
- Provides primary, secondary, accent, and neutral colors
- Includes specific hex codes with usage guidelines]

### 🔍 **ANALYSIS SUMMARY**
[Provide a detailed 3-4 sentence analysis of the most critical issues found, prioritized by impact]

### ⚠️ **KEY ISSUES IDENTIFIED**
- **High Priority:** [List 2-3 most critical issues]
- **Medium Priority:** [List 2-3 moderate issues]
- **Low Priority:** [List 1-2 minor improvements]

### 💡 **IMPROVED CODE**

**HTML:**
\`\`\`html
[Provide semantically correct, accessible HTML with proper structure and ARIA labels]
\`\`\`

**CSS:**
\`\`\`css
[Provide modern, responsive CSS using best practices like CSS Grid/Flexbox, custom properties, and mobile-first approach. 
IMPORTANT: Include CSS custom properties (variables) for the color palette based on your analysis:
- Extract and refine colors from the original design
- Create a cohesive color system with primary, secondary, accent, and neutral colors
- Ensure all colors meet accessibility contrast requirements
- Use semantic variable names (--primary-color, --accent-color, --text-color, etc.)
- Apply the color system consistently throughout the CSS]
\`\`\`

### 🎯 **IMPLEMENTATION NOTES**
[Brief explanation of key changes and their benefits, including:
- How the color palette was refined while maintaining design intent
- Why specific color choices improve accessibility and visual hierarchy
- Color psychology considerations for the suggested palette]

---

## CODE TO ANALYZE:

**HTML:**
${html}

**CSS:**
${css}

## SPECIFIC FOCUS AREAS:
- **Color Analysis Priority:** First identify ALL colors used (backgrounds, text, borders, gradients, inline styles)
- Extract the color palette and assess harmony, contrast, and accessibility
- Suggest improved colors that maintain the original design's mood/intent while fixing issues
- Ensure semantic HTML5 elements are used appropriately
- Add comprehensive accessibility features (ARIA labels, roles, proper heading hierarchy)
- Implement responsive design with mobile-first approach
- Use modern CSS features (Grid, Flexbox, custom properties with color variables)
- Optimize for performance and maintainability
- Follow current web standards and best practices
- Ensure proper color contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text and UI)
- Add focus indicators for keyboard navigation
- Create a cohesive color system using CSS custom properties that respects the original palette`;

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
