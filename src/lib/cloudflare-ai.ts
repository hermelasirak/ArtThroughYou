type CloudflareImageResult = { image?: string; mimeType?: string };
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

export async function generateCloudflareImage(
  model: string,
  input: Record<string, unknown>
): Promise<CloudflareImageResult> {
  if (!accountId || !apiToken) {
    throw new Error('Cloudflare image generation is not configured. Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to the server environment.');
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input),
      cache: 'no-store'
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const detail = JSON.stringify(payload.errors || payload).slice(0, 500);
    throw new Error(`Cloudflare image request failed (${response.status}): ${detail}`);
  }

  const result = payload.result || payload;
  const image = result.image || result.output || result.data;
  if (typeof image !== 'string' || !image.length) {
    throw new Error('Cloudflare returned no generated image.');
  }

  return { image, mimeType: result.mimeType || 'image/jpeg' };
}

export async function generateCloudflareImageFromReference(
  model: string,
  input: { prompt: string; imageBase64: string; mimeType: string; width: number; height: number; guidance?: number }
): Promise<CloudflareImageResult> {
  if (!accountId || !apiToken) {
    throw new Error('Cloudflare image generation is not configured. Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to the server environment.');
  }

  const imageBytes = Buffer.from(input.imageBase64, 'base64');
  const form = new FormData();
  form.append('prompt', input.prompt);
  form.append('input_image_0', new Blob([imageBytes], { type: input.mimeType }), 'portrait');
  form.append('width', String(input.width));
  form.append('height', String(input.height));
  if (input.guidance !== undefined) form.append('guidance', String(input.guidance));

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiToken}` },
      body: form,
      cache: 'no-store'
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const detail = JSON.stringify(payload.errors || payload).slice(0, 500);
    throw new Error(`Cloudflare image request failed (${response.status}): ${detail}`);
  }

  const result = payload.result || payload;
  const image = result.image || result.output || result.data;
  if (typeof image !== 'string' || !image.length) {
    throw new Error('Cloudflare returned no generated image.');
  }

  return { image, mimeType: result.mimeType || 'image/jpeg' };
}
