import type { Answers } from './quiz';

/** One visitor's journey: five chapters and a final reflection, saved in the browser. */
export type PortraitSession = {
  id: string;
  name: string;
  answers: Answers;
  /** Index of the step currently shown (0–5). */
  step: number;
  completed: boolean;
  portraitUrl?: string;
  /** 'ai' = generated; 'demo' = AI mode was off; 'unavailable' = the image service failed, so a preview is shown. */
  portraitSource?: 'ai' | 'demo' | 'unavailable';
  /** True when the portrait was guided by an uploaded photo. The photo itself is never saved. */
  portraitFromPhoto?: boolean;
  /** Collection artworks keyed by chapter number; regenerated if the chapter's answer changes. */
  chapterArt?: Record<string, { choiceId: string; url: string }>;
  createdAt: string;
};
