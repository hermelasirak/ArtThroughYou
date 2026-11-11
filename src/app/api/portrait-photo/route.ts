import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateCloudflareImageFromReference } from '@/lib/cloudflare-ai';

export const runtime = 'nodejs';

// The portrait prompt plus an optional photo of the visitor, used to guide resemblance.
// The photo is only forwarded to the image service for this request and is never stored.
const schema = z.object({
  prompt: z.string().min(10).max(4000),
  photo: z.string().max(12_000_000).regex(/^data:image\/(png|jpeg|webp);base64,/)
});

export async function POST(req: Request) {
  try {
    const { prompt, photo } = schema.parse(await req.json());
    const generated = await generateCloudflareImageFromReference('@cf/black-forest-labs/flux-2-klein-4b', {
      prompt: `${prompt} Use the supplied photo as the visual identity reference: keep the same person's face, age, skin tone and recognisable features. No text, lettering, logos or watermarks.`,
      imageBase64: photo.slice(photo.indexOf(',') + 1),
      mimeType: photo.slice(5, photo.indexOf(';')),
      width: 768, height: 768, guidance: 4
    });
    return NextResponse.json({ dataUrl: `data:${generated.mimeType || 'image/jpeg'};base64,${generated.image}` });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Portrait generation failed.' }, { status: 502 });
  }
}
