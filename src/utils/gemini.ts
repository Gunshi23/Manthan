/**
 * Gemini API utility for orbit.ai.
 * Provides a helper to query the Gemini API using native fetch.
 */

export interface GeminiResponse {
  text: string;
  error?: string;
}

/**
 * Call the Google Generative Language Model Service endpoint.
 * Falls back to throwing an error if the key is missing or calls fail.
 */
export async function callGeminiAPI(
  prompt: string,
  systemInstruction?: string,
  apiKey?: string
): Promise<string> {
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("Gemini API key is not configured.");
  }

  // Use the specified model - gemini-2.0-flash
  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody: any = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1500,
    },
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [
        {
          text: systemInstruction,
        },
      ],
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.error && errJson.error.message) {
        errorMsg = errJson.error.message;
      }
    } catch (e) {
      // Ignore json parse error
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Empty response or unexpected format from Gemini API");
  }

  return text;
}

/**
 * Helper to safely parse JSON from Gemini's response.
 * Handles potential markdown JSON fencing (e.g. ```json ... ```).
 */
export function parseGeminiJson<T>(text: string, fallback: T): T {
  try {
    // Strip markdown JSON codeblock formatting if present
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      // Match ```json ... ``` or ``` ... ```
      const match = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
      if (match && match[1]) {
        cleaned = match[1].trim();
      }
    }
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.warn("Failed to parse Gemini response as JSON. Text was:", text, err);
    return fallback;
  }
}
