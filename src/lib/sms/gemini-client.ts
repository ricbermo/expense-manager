const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface GeminiRequestBody {
  contents: Array<{
    parts: Array<{ text: string }>;
  }>;
  generationConfig: {
    responseMimeType: "application/json";
    responseSchema: unknown;
    temperature?: number;
  };
}

export interface GeminiResponseShape {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
}

export async function callGemini(
  prompt: string,
  responseSchema: unknown,
  options: { apiKey?: string; fetchImpl?: typeof fetch; temperature?: number } = {}
): Promise<string> {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
  }

  const body: GeminiRequestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: options.temperature ?? 0,
    },
  };

  const fetchFn = options.fetchImpl ?? fetch;
  const res = await fetchFn(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${text || res.statusText}`);
  }

  const json = (await res.json()) as GeminiResponseShape;
  if (json.error) {
    throw new Error(`Gemini API error: ${json.error.message ?? "unknown"}`);
  }

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  return text;
}