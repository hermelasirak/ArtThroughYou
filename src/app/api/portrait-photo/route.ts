import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateCloudflareImage } from '@/lib/cloudflare-ai';

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
    const imageData = photo.slice(photo.indexOf(',') + 1);
    const generated = await generateCloudflareImage('@cf/runwayml/stable-diffusion-v1-5-img2img', {
      prompt: `${prompt} Keep the same person's face, age, skin tone and recognisable features as in the reference photo.`,
      negative_prompt: 'text, letters, watermark, logo, extra faces, distorted anatomy, deformed hands',
      image_b64: imageData, width: 512, height: 512, num_steps: 20, strength: 0.6, guidance: 7.5
    });
    return NextResponse.json({ dataUrl: `data:${generated.mimeType || 'image/jpeg'};base64,${generated.image}` });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Portrait generation failed.' }, { status: 502 });
  }
}
