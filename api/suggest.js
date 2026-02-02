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

  const aiPrompt = `You are an expert web developer and UI/UX designer with a strong eye for design aesthetics and color theory. Analyze the provided HTML and CSS code comprehensively and provide detailed, actionable improvements.

⚠️ CRITICAL DESIGN PRINCIPLES:
This is a FRESH analysis. Treat each landing page as unique. Think like a professional designer:
- Analyze the visual hierarchy and design intent
- Identify the PRIMARY brand color (most prominent, likely used for CTAs/headers)
- Identify SECONDARY supporting colors (used for accents, highlights)
- Recognize utility colors (backgrounds, borders, subtle elements)
- Create a COHESIVE, BALANCED color palette (not a mix of every color found)
- Apply proper color theory and visual harmony principles

## Analysis Framework:
Evaluate the code across these dimensions:
1. **Design System & Visual Hierarchy** - Color palette coherence, typography scale, spacing consistency
2. **Semantic HTML & Structure** - Proper element usage, document outline, markup quality
3. **Accessibility (WCAG 2.1)** - Screen reader support, keyboard navigation, color contrast, ARIA attributes
4. **Modern CSS Practices** - Flexbox/Grid usage, responsive design, CSS custom properties
5. **User Experience** - Visual appeal, readability, interaction patterns, mobile responsiveness
6. **Performance & Maintainability** - Code efficiency, organization, best practices

## Response Format:
### 🔍 **ANALYSIS SUMMARY**
[Provide a 2-3 sentence design-focused analysis: What is the design intent? What are the critical issues affecting visual appeal and usability?]

### ⚠️ **KEY ISSUES IDENTIFIED**
**High Priority:** [Critical issues affecting functionality, accessibility, or user experience]
**Medium Priority:** [Moderate improvements for design consistency and code quality]
**Low Priority:** [Minor refinements and optimizations]

### 🎨 **DESIGN ANALYSIS**
**Current Color Palette Detected:**
- [List all colors found with their usage context, e.g., "#3498db (buttons, links)", "#2c3e50 (text)", "#ecf0f1 (background)"]

**Recommended Color System:**
Based on the design intent and visual hierarchy, here's the optimized palette:
- Primary: [The main brand/action color - should be the most prominent]
- Secondary: [Supporting color for secondary actions/accents]
- Text: [Primary text color with good contrast]
- Background: [Main background color]
- Surface: [Card/section backgrounds]
- Border/Divider: [Subtle colors for separators]
- Accent: [Optional - for highlights/special elements]

**Design Rationale:** [1-2 sentences explaining why these colors were chosen and how they create visual harmony]

### 💡 **IMPROVED CODE**

**HTML:**
\`\`\`html
[Provide semantically correct, accessible HTML with:
- Proper semantic elements (<header>, <main>, <footer>, <nav>, <section>)
- ARIA attributes where needed
- Logical heading hierarchy (h1 → h2 → h3)
- Well-structured, responsive footer layout]
\`\`\`

**CSS:**
\`\`\`css
/* ==========================================
   DESIGN SYSTEM - Color & Typography
   ========================================== */
:root {
    /* Primary Color Palette - Intelligently selected */
    --color-primary: [Main brand color];
    --color-primary-dark: [Darker shade for hover states];
    --color-primary-light: [Lighter shade for backgrounds];
    
    --color-secondary: [Secondary accent color];
    
    /* Neutral Colors - For text and backgrounds */
    --color-text-primary: [Main text color, ensure 4.5:1 contrast];
    --color-text-secondary: [Secondary text, muted];
    --color-background: [Page background];
    --color-surface: [Card/section backgrounds];
    --color-border: [Borders and dividers];
    
    /* Typography System */
    --font-primary: [Extracted font or modern system font stack];
    --font-size-base: 1rem;
    --font-size-sm: 0.875rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.5rem;
    --font-size-2xl: 2rem;
    --line-height-tight: 1.2;
    --line-height-normal: 1.6;
    --line-height-relaxed: 1.8;
    
    /* Spacing Scale - Consistent rhythm */
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;
    --space-xl: 2.5rem;
    --space-2xl: 4rem;
    
    /* Layout & Effects */
    --max-width: 1200px;
    --border-radius: 0.5rem;
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
    --transition: all 0.3s ease;
}

/* ==========================================
   Base Styles & Typography
   ========================================== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: var(--font-primary);
    font-size: var(--font-size-base);
    line-height: var(--line-height-normal);
    color: var(--color-text-primary);
    background-color: var(--color-background);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* ==========================================
   Layout Components
   ========================================== */
[Provide modern, mobile-first CSS with proper layout using Grid/Flexbox]

/* ==========================================
   Footer - Responsive & Well-Structured
   ========================================== */
footer {
    background-color: var(--color-surface);
    border-top: 1px solid var(--color-border);
    padding: var(--space-xl) var(--space-md);
    margin-top: auto;
}

.footer-container {
    max-width: var(--max-width);
    margin: 0 auto;
    display: grid;
    gap: var(--space-lg);
    grid-template-columns: 1fr;
}

/* Responsive footer layout */
@media (min-width: 640px) {
    .footer-container {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 768px) {
    .footer-container {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }
}

.footer-section h3 {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin-bottom: var(--space-md);
    color: var(--color-text-primary);
}

.footer-section ul {
    list-style: none;
}

.footer-section a {
    color: var(--color-text-secondary);
    text-decoration: none;
    transition: var(--transition);
}

.footer-section a:hover {
    color: var(--color-primary);
}

.footer-bottom {
    margin-top: var(--space-xl);
    padding-top: var(--space-md);
    border-top: 1px solid var(--color-border);
    text-align: center;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
}

/* ==========================================
   Responsive Design - Mobile First
   ========================================== */
@media (max-width: 639px) {
    /* Mobile optimizations */
}

@media (min-width: 768px) {
    /* Tablet adjustments */
}

@media (min-width: 1024px) {
    /* Desktop enhancements */
}
\`\`\`

### 🎯 **IMPLEMENTATION NOTES**
**Design Improvements:**
- [Key visual/design changes made]
- [How the color system creates harmony]
- [Layout improvements for better UX]

**Technical Improvements:**
- [Semantic HTML and accessibility enhancements]
- [Modern CSS techniques applied]
- [Responsive design approach]

---

## CODE TO ANALYZE:

**HTML:**
${html}

**CSS:**
${css}

## CRITICAL INSTRUCTIONS - DESIGNER MINDSET:

🎨 **INTELLIGENT COLOR SELECTION:**
1. **Analyze Color Usage Context:** Look at WHERE and HOW colors are used:
   - Which color is used for primary CTAs, buttons, or links? → This is likely the PRIMARY color
   - Which colors are used for headings or key elements? → Consider for secondary
   - Which colors are just backgrounds or borders? → These are utility colors
   
2. **Apply Design Judgment:**
   - If you find 4+ colors, DON'T use all of them blindly
   - Select the 1-2 most prominent/brand colors as primary/secondary
   - Use neutral grays for text and backgrounds (you can derive these)
   - Ensure colors work together harmoniously
   
3. **Color Palette Rules:**
   - Primary: The hero/brand color (most visually important)
   - Secondary: Complementary accent (if there's a clear secondary color, otherwise derive from primary)
   - Text: High contrast for readability (usually dark gray #1e293b or similar)
   - Background: Typically white/light gray (#ffffff or #f8fafc)
   - Don't create CSS variables for every random color found
   
4. **Example Decision Making:**
   - Found colors: #3498db (buttons), #e74c3c (error messages), #2c3e50 (text), #ecf0f1 (background)
   - Smart choice: Primary=#3498db, Text=#2c3e50, Background=#ecf0f1, Accent=#e74c3c (for warnings only)
   - Avoid: Creating variables for all 4 colors equally

🏗️ **LAYOUT & VISUAL HIERARCHY:**
- Apply proper spacing scale (consistent margins/padding)
- Create clear visual hierarchy with typography sizing
- Ensure footer layout is balanced and professional
- Mobile: Stack elements vertically with proper spacing
- Desktop: Use Grid for multi-column layouts

✅ **TECHNICAL REQUIREMENTS:**
- Use semantic HTML5 elements (<header>, <main>, <footer>, <nav>, <section>)
- Add ARIA labels for accessibility (aria-label, role, aria-describedby)
- Implement mobile-first responsive design (320px → 768px → 1024px+)
- Use CSS Grid/Flexbox (no floats or table layouts)
- Ensure 4.5:1 contrast ratio for text, 3:1 for large text/UI elements
- Add :focus-visible styles for keyboard navigation
- Update copyright year to ${new Date().getFullYear()}

🎯 **FINAL CHECK:**
Before submitting your response, ask yourself:
- Does this color palette look cohesive and professional?
- Would a real designer approve these color choices?
- Are the colors balanced (not using every detected color)?
- Is the layout clean, organized, and responsive?
- Does the footer work well on both mobile and desktop?

Think like a designer first, then apply the technical improvements.`;

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
