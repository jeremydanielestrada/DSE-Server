# 🚀 DSE-Server (DesignSnap Edu Server)

<div align="center">

**AI-Powered Backend API for DesignSnap Edu**

A serverless Node.js API that powers the DesignSnap Edu Chrome extension with intelligent UI/UX analysis using Groq AI.

[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

</div>

---

## 🚀 Features

- 🤖 **Groq AI Integration** - Leverages Llama 3.3 70B for intelligent code analysis
- ⚡ **Serverless Architecture** - Deployed on Vercel for optimal performance
- 🔒 **Input Validation** - Robust validation and error handling
- 📊 **Usage Tracking** - Token usage monitoring and reporting
- 🌐 **CORS Enabled** - Seamless integration with Chrome extension
- 🎯 **Optimized Prompts** - Specialized prompts for UI/UX analysis

---

## 🛠️ Built With

<div align="center">

| Technology                                                                                                        | Purpose              |
| ----------------------------------------------------------------------------------------------------------------- | -------------------- |
| ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)        | Runtime Environment  |
| ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) | Programming Language |
| ![Groq](https://img.shields.io/badge/Groq-AI-FF6B35?style=for-the-badge&logo=ai&logoColor=white)                  | AI Analysis Engine   |
| ![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)             | Serverless Hosting   |
| ![Node-Fetch](https://img.shields.io/badge/node--fetch-3.3.2-blue?style=for-the-badge)                            | HTTP Client          |

</div>

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Groq API Key** - Get yours at [console.groq.com](https://console.groq.com)
- **Vercel Account** (for deployment) - [vercel.com](https://vercel.com)

---

## 🔧 Local Installation

### 1. Clone the Repository

```bash
git clone https://github.com/jeremydanielestrada/DesignSnap-Edu.git
cd DSE-Server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key_here
```

> **Get Your API Key**: Visit [console.groq.com](https://console.groq.com) to create a free account and generate an API key.

### 4. Run Locally

```bash
# Using Vercel CLI (recommended)
vercel dev

# Or using Node.js directly
node api/suggest.js
```

The server will be available at `http://localhost:3000`

---

## 🌐 Deployment (Vercel)

### Option 1: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Option 2: Deploy via GitHub Integration

1. Push your code to GitHub
2. Visit [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Add environment variable: `GROQ_API_KEY`
5. Click **Deploy**

### Setting Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Key**: `GROQ_API_KEY`
   - **Value**: Your Groq API key
   - **Environments**: Production, Preview, Development
4. Redeploy your project

---

## 📁 Project Structure

```
DSE-Server/
├── api/
│   └── suggest.js           # Main API endpoint
├── node_modules/            # Dependencies (auto-generated)
├── package.json             # Project configuration & dependencies
├── vercel.json              # Vercel deployment configuration
├── README.md                # This file
└── IMPROVEMENTS_SUMMARY.md  # Development notes
```

---

## 🔌 API Endpoints

### POST `/api/suggest`

Analyzes HTML and CSS code and provides AI-powered suggestions.

#### Request

```javascript
POST /api/suggest
Content-Type: application/json

{
  "html": "<div>Your HTML code here</div>",
  "css": "body { margin: 0; }"
}
```

#### Success Response (200 OK)

```javascript
{
  "success": true,
  "analysis": "### 🔍 ANALYSIS SUMMARY\n...",
  "usage": {
    "prompt_tokens": 1234,
    "completion_tokens": 567,
    "total_tokens": 1801
  }
}
```

#### Error Response (500 Internal Server Error)

```javascript
{
  "success": false,
  "error": "Error message here",
  "timestamp": "2025-10-17T12:34:56.789Z"
}
```

#### Validation Errors

**400 Bad Request** - Missing required fields:

```javascript
{
  "success": false,
  "error": "Both HTML and CSS content are required"
}
```

**400 Bad Request** - Content too large:

```javascript
{
  "success": false,
  "error": "HTML or CSS content is too large (max 20,000 characters each)"
}
```

---

## 🤖 AI Model Configuration

### Current Model

- **Model**: `llama-3.3-70b-versatile`
- **Provider**: Groq (Meta Llama)
- **Speed**: ~280 tokens/second
- **Context Window**: 131,072 tokens
- **Max Output**: 32,768 tokens

### Model Parameters

```javascript
{
  model: "llama-3.3-70b-versatile",
  temperature: 0.3,        // Low for consistent, focused responses
  max_tokens: 4000         // Enough for detailed analysis
}
```

### Alternative Models

You can switch to other Groq models by modifying `api/suggest.js`:

| Model                     | Speed   | Best For                   |
| ------------------------- | ------- | -------------------------- |
| `llama-3.1-8b-instant`    | 560 tps | Fast responses, lower cost |
| `llama-3.3-70b-versatile` | 280 tps | **Balanced** (current) ✅  |
| `openai/gpt-oss-120b`     | 500 tps | Advanced reasoning         |

---

## 🎯 Analysis Features

The API analyzes code across multiple dimensions:

### 1. 🏗️ Semantic HTML & Structure

- Proper element usage
- Document outline evaluation
- Markup quality assessment

### 2. ♿ Accessibility (WCAG 2.1)

- Screen reader compatibility
- Keyboard navigation
- Color contrast ratios
- ARIA attributes

### 3. 🎨 Modern CSS Practices

- Flexbox/Grid optimization
- Responsive design patterns
- CSS custom properties
- Mobile-first approach

### 4. ⚡ Performance

- Code efficiency
- Loading optimization
- Best practices

### 5. 🎭 User Experience

- Visual hierarchy
- Readability improvements
- Interaction patterns

### 6. 🌐 Cross-browser Compatibility

- Modern standards compliance
- Browser compatibility checks

---

## 🔐 Security Features

- ✅ **Input Validation** - Validates and sanitizes all inputs
- ✅ **Content Length Limits** - Prevents abuse (max 20KB per field)
- ✅ **Error Handling** - Comprehensive error catching and logging
- ✅ **API Key Protection** - Environment variable storage
- ✅ **CORS Configuration** - Controlled access
- ✅ **Method Restrictions** - POST only for suggest endpoint

---

## 📊 Rate Limits (Groq API)

- **Tokens Per Minute**: 300,000 TPM
- **Requests Per Minute**: 1,000 RPM
- **Max Tokens Per Request**: 32,768

---

## 🐛 Troubleshooting

### 500 Error: Invalid Model

**Problem**: `llama-3.1-70b-versatile` doesn't exist  
**Solution**: Use `llama-3.3-70b-versatile` instead

### API Key Errors

**Problem**: "Invalid API key" or authentication failed  
**Solution**:

1. Verify your API key at [console.groq.com](https://console.groq.com)
2. Check environment variable is set correctly
3. Redeploy if using Vercel

### CORS Errors

**Problem**: Cross-origin request blocked  
**Solution**: Ensure your extension origin is allowed in CORS configuration

### Timeout Errors

**Problem**: Request takes too long  
**Solution**:

- Reduce HTML/CSS input size
- Use faster model (llama-3.1-8b-instant)
- Check network connection

---

## 🧪 Testing

### Test the API Locally

```bash
curl -X POST http://localhost:3000/api/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<div>Test</div>",
    "css": "div { color: red; }"
  }'
```

### Test the Deployed API

```bash
curl -X POST https://dse-server.vercel.app/api/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<div>Test</div>",
    "css": "div { color: red; }"
  }'
```

---

## 📈 Performance Optimization

### Tips for Optimal Performance

1. **Limit Input Size** - Keep HTML/CSS under 20KB
2. **Use Caching** - Consider implementing response caching
3. **Monitor Token Usage** - Track usage with the returned `usage` object
4. **Optimize Prompts** - Tailor prompts to specific use cases
5. **Use Appropriate Model** - Balance speed vs. quality needs

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Jeremy Daniel Estrada**

- GitHub: [@jeremydanielestrada](https://github.com/jeremydanielestrada)

---

## 🙏 Acknowledgments

- **Groq** for providing the lightning-fast AI inference
- **Meta** for the Llama 3.3 70B model
- **Vercel** for serverless hosting platform
- **Node-Fetch** for HTTP client functionality

---

## 📚 Resources

- [Groq Documentation](https://console.groq.com/docs)
- [Groq Models](https://console.groq.com/docs/models)
- [Vercel Documentation](https://vercel.com/docs)
- [Node.js Documentation](https://nodejs.org/docs)

---

<div align="center">

**Made with ❤️ and AI**

[Report Bug](https://github.com/jeremydanielestrada/DesignSnap-Edu/issues) · [Request Feature](https://github.com/jeremydanielestrada/DesignSnap-Edu/issues)

</div>
