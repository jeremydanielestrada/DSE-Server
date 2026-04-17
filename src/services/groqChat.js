import fetch from "node-fetch";

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";

function getGroqApiKey() {
  return process.env.GROQ_API_KEY;
}

export async function groqChatCompletions(body) {
  const apiKey = getGroqApiKey();
  const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  return { response, text, json };
}

