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

⚠️ CRITICAL: This is a FRESH, INDEPENDENT analysis. Do NOT carry over any styles, colors, fonts, or CSS variables from any previous analysis. Extract and use ONLY the design elements present in the current code provided below.

## Analysis Framework:
Evaluate the code across these dimensions:
1. **Semantic HTML & Structure** - Proper element usage, document outline, markup quality
2. **Accessibility (WCAG 2.1)** - Screen reader support, keyboard navigation, color contrast, ARIA attributes
3. **Modern CSS Practices** - Flexbox/Grid usage, responsive design, CSS custom properties
4. **Performance** - Code efficiency, loading optimization, best practices
5. **User Experience** - Visual hierarchy, readability, interaction patterns
6. **Cross-browser Compatibility** - Modern standards compliance

## Response Format:
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
/* ==========================================
   CSS VARIABLES - Extracted from THIS page
   ========================================== */
:root {
    /* IMPORTANT: Extract colors ONLY from the actual CSS provided below
       Do NOT use generic colors or previous page colors */
    --primary-color: [Extract from current CSS];
    --secondary-color: [Extract from current CSS];
    --text-color: [Extract from current CSS];
    --background-color: [Extract from current CSS];
    
    /* Extract font family from current CSS, or use modern system font stack */
    --font-primary: [Extract from current CSS or use: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif];
    
    /* Spacing scale based on current design patterns */
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;
    --space-xl: 2rem;
}

/* ==========================================
   Improved Styles - Mobile-First Approach
   ========================================== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: var(--font-primary);
    color: var(--text-color);
    background-color: var(--background-color);
    line-height: 1.6;
}

[Provide modern, responsive CSS using Grid/Flexbox, with proper mobile-first media queries]

/* ==========================================
   Footer - Responsive Layout
   ========================================== */
footer {
    background-color: var(--surface, #f8fafc);
    padding: var(--space-xl) var(--space-md);
    margin-top: auto;
}

.footer-container {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    gap: var(--space-lg);
    grid-template-columns: 1fr;
}

/* Tablet and up: Multi-column footer */
@media (min-width: 768px) {
    .footer-container {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }
}

.footer-bottom {
    text-align: center;
    padding-top: var(--space-md);
    margin-top: var(--space-md);
    border-top: 1px solid var(--border, #e2e8f0);
    font-size: 0.875rem;
}
\`\`\`

### 🎯 **IMPLEMENTATION NOTES**
[Brief explanation of key changes and their benefits, specifically for THIS landing page]

---

## CODE TO ANALYZE:

**HTML:**
${html}

**CSS:**
${css}

## CRITICAL REQUIREMENTS - READ CAREFULLY:

🎯 **CONTEXT-AWARENESS - MOST IMPORTANT:**
- This is an INDEPENDENT analysis session
- Extract CSS variables ONLY from the colors, fonts, and values present in the code above
- Do NOT reuse colors like #333, #666, #f0f0f0, or Arial from previous analyses unless they actually appear in THIS code
- If the current CSS uses #2563eb and 'Poppins', your variables should use those exact values
- If the current CSS uses #ff6b6b and 'Montserrat', use those instead
- Each landing page has its own unique design system - detect and preserve it

🎨 **COLOR EXTRACTION:**
- Identify ALL unique colors in the provided CSS
- Set --primary-color to the most prominent/brand color found
- Set --secondary-color to the second most used color
- Set --text-color and --background-color to actual text/background colors used
- Do NOT invent new colors that aren't in the original code

📝 **TYPOGRAPHY:**
- Use the exact font-family found in the CSS
- If no font is specified or it's a generic font, suggest a modern system font stack
- Do NOT default to Arial unless it's actually used in the current code

📐 **FOOTER LAYOUT:**
- Ensure footer works on mobile (320px width), tablet (768px), and desktop (1024px+)
- Mobile: Single column, stacked layout
- Desktop: Multi-column grid layout with proper spacing
- Include proper semantic structure with footer > .footer-container > sections

✅ **OTHER REQUIREMENTS:**
- Use semantic HTML5 elements (<header>, <main>, <footer>, <nav>, <section>, <article>)
- Add ARIA attributes where needed (aria-label, aria-describedby, role)
- Implement mobile-first responsive design with media queries
- Use CSS Grid or Flexbox for layouts (avoid floats)
- Ensure 4.5:1 color contrast for normal text
- Add :focus-visible styles for keyboard navigation
- Update copyright year to ${new Date().getFullYear()}

⚠️ REMEMBER: Treat this as a completely NEW landing page. Your suggestions must be based ONLY on the HTML and CSS provided in this request, not any previous analysis.`;

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
