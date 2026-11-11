type GeminiPart = { text?: string; inline_data?: { mime_type: string; data: string } };
type GeminiOutputPart = { text?: string; inlineData?: { mimeType?: string; data?: string } };
type GeminiConfig = {
  responseMimeType?: string;
  responseModalities?: string[];
  temperature?: number;
  maxOutputTokens?: number;
  imageConfig?: { aspectRatio?: string; imageSize?: string };
};

export async function generateWithGemini(
  model: string,
  parts: GeminiPart[],
  generationConfig: GeminiConfig = {}
): Promise<GeminiOutputPart[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig }),
    cache: 'no-store'
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${detail.slice(0, 500)}`);
  }
  const data = await response.json();
  const output = data.candidates?.[0]?.content?.parts as GeminiOutputPart[] | undefined;
  if (!output?.length) throw new Error('Gemini returned an empty response.');
  return output;
}
