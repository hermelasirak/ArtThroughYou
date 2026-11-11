import { ERAS, type Choice, type Era } from './eras';

// Era ids: 1 Prehistoric, 2 Ancient, 3 Renaissance, 4 Impressionism, 5 Digital & AI.
export type EraId = 1 | 2 | 3 | 4 | 5;
const ERA_IDS: EraId[] = [1, 2, 3, 4, 5];

// Creative archetypes, not scientific personality classifications.
export const ARCHETYPES: Record<EraId, { era: string; title: string; description: string; interpretation: string }> = {
  1: { era: 'Prehistoric Art', title: 'The instinctive soul', description: 'Raw, expressive, and deeply connected to nature and instinct. Art in its most elemental form.', interpretation: 'Your choices reflect instinct, honesty, and a deep connection to the world around you. You trust what you feel, and you believe the simplest marks can carry the strongest meaning.' },
  2: { era: 'Ancient Civilizations', title: 'The timeless spirit', description: 'Symbolic, purposeful, and drawn to meaning, tradition, and lasting connections.', interpretation: 'Your choices reflect loyalty, purpose, and a respect for what lasts. You value the people and traditions that shaped you, and you want what you create to carry meaning across generations.' },
  3: { era: 'Renaissance', title: 'The thoughtful visionary', description: 'Curious, reflective, and inspired by knowledge, balance, and human potential.', interpretation: 'Your choices reflect curiosity, imagination, and a desire to understand the world beyond its surface. You value discovery, but you also believe that what we create should carry meaning.' },
  4: { era: 'Impressionism', title: 'The free spirit', description: 'Sensitive to beauty, emotion, and fleeting moments. Guided by feeling and imagination.', interpretation: 'Your choices reflect sensitivity, spontaneity, and an eye for beauty in passing moments. You follow feeling over formula, and you notice what others hurry past.' },
  5: { era: 'Digital & AI Art', title: 'The future thinker', description: 'Experimental, imaginative, and open to possibilities beyond convention.', interpretation: 'Your choices reflect imagination, openness, and a readiness to rethink the rules. You are drawn to what doesn\'t exist yet, and you believe creativity grows when it is shared.' }
};

/** Which part of the portrait each chapter's decision shapes. */
export const CHAPTER_DIMENSIONS: Record<EraId, string> = {
  1: 'Symbol', 2: 'Setting', 3: 'Expression', 4: 'Colour & light', 5: 'Composition'
};

/**
 * The character profile. Every answer adds points (0–3) to these five qualities. The era is then
 * matched on the overall pattern of the profile, never on which chapter an answer came from.
 */
export const QUALITIES = ['curiosity', 'connection', 'creativity', 'reflection', 'independence'] as const;
export type Quality = (typeof QUALITIES)[number];
type Points = Partial<Record<Quality, number>>;
export const QUALITY_LABELS: Record<Quality, string> = {
  curiosity: 'Curiosity', connection: 'Connection', creativity: 'Creativity', reflection: 'Reflection', independence: 'Independence'
};

/**
 * Each archetype's characteristic pattern across the five qualities (0–100). Only the shape matters:
 * a visitor matches the era whose pattern their profile correlates with most closely.
 */
const ERA_PATTERNS: Record<EraId, Record<Quality, number>> = {
  1: { curiosity: 45, connection: 60, creativity: 45, reflection: 20, independence: 85 }, // instinctive soul: free, communal, acts before reflecting
  2: { curiosity: 30, connection: 85, creativity: 30, reflection: 70, independence: 15 }, // timeless spirit: tradition, belonging, meaning
  3: { curiosity: 90, connection: 35, creativity: 50, reflection: 70, independence: 50 }, // thoughtful visionary: knowledge and reflection
  4: { curiosity: 25, connection: 50, creativity: 70, reflection: 85, independence: 40 }, // free spirit: feeling, beauty, the passing moment
  5: { curiosity: 65, connection: 45, creativity: 90, reflection: 15, independence: 70 }  // future thinker: invention and new possibilities
};

type ChoiceEffect = {
  /** How this decision shows up in the portrait, for its chapter's dimension. */
  detail: string;
  /** Points this decision adds to each quality of the character profile. */
  profile: Points;
  /** The quality this decision shows, used in "Your ___ inspired…" and as the core quality. */
  quality: string;
  /** How that quality appears in the portrait, e.g. "the far-off, visionary gaze". */
  shape: string;
  /** One-line reflection on the collection card. */
  reflection: string;
};

// Keyed by chapter (era id), then by the choice id in eras.ts.
const EFFECTS: Record<EraId, Record<string, ChoiceEffect>> = {
  1: {
    A: { detail: 'a running animal drawn in a few sure lines', profile: { curiosity: 1, reflection: 1, independence: 1 }, quality: 'attentiveness', shape: 'the running animal drawn beside you', reflection: 'You notice the world that guides you.' },
    B: { detail: 'a small flame cupped in both hands', profile: { connection: 3 }, quality: 'protective warmth', shape: 'the small flame cupped in your hands', reflection: 'You keep the people you love close.' },
    C: { detail: 'a hand-drawn map pointing towards unexplored ground', profile: { curiosity: 2, independence: 1 }, quality: 'sense of adventure', shape: 'the hand-drawn map you carry', reflection: 'You chose discovery over familiarity.' },
    D: { detail: 'a ring of storytelling figures', profile: { connection: 2, creativity: 1 }, quality: 'love of storytelling', shape: 'the ring of storytelling figures around you', reflection: 'You believe stories hold people together.' },
    E: { detail: 'a secret sign only a few would understand', profile: { reflection: 1, independence: 2 }, quality: 'quiet independence', shape: 'the secret sign hidden in the portrait', reflection: 'You choose carefully what you reveal.' },
    F: { detail: 'a handprint stencilled in red ochre', profile: { connection: 1, independence: 2 }, quality: 'resilience', shape: 'the red ochre handprint', reflection: 'You honour effort and determination.' }
  },
  2: {
    A: { detail: 'a carved hall of ancestral stone', profile: { connection: 2, reflection: 1 }, quality: 'devotion to the past', shape: 'the carved hall of ancestral stone behind you', reflection: 'You believe the past deserves to be remembered.' },
    B: { detail: 'a busy marketplace full of everyday life', profile: { connection: 1, creativity: 1, reflection: 1 }, quality: 'appreciation for everyday life', shape: 'the busy marketplace around you', reflection: 'You find beauty in ordinary life.' },
    C: { detail: 'a library of scrolls and star charts', profile: { curiosity: 3 }, quality: 'curiosity', shape: 'the library of scrolls and star charts behind you', reflection: 'You want knowledge to outlive you.' },
    D: { detail: 'an open meeting place where many paths cross', profile: { connection: 3 }, quality: 'appreciation for human connection', shape: 'the open meeting place around you', reflection: 'You bring different people together.' },
    E: { detail: 'the shadowed back corridors of a grand monument', profile: { independence: 3 }, quality: 'independent spirit', shape: 'the shadowed corridors behind you', reflection: 'You question who gets remembered.' },
    F: { detail: 'a firelit gathering place marked with ritual signs', profile: { connection: 1, creativity: 2 }, quality: 'sense of ritual', shape: 'the firelit gathering place behind you', reflection: 'You create meaning others can share.' }
  },
  3: {
    A: { detail: 'a focused, observant gaze that misses nothing', profile: { curiosity: 2, reflection: 1 }, quality: 'attention to detail', shape: 'the focused, observant gaze', reflection: 'You find beauty in close observation.' },
    B: { detail: 'an open, emotionally honest face looking directly out', profile: { connection: 1, reflection: 2 }, quality: 'empathy', shape: 'the open, emotionally honest expression', reflection: 'You look beyond appearances to find meaning.' },
    C: { detail: 'a far-off look, as if seeing something not yet built', profile: { curiosity: 1, creativity: 2 }, quality: 'imagination', shape: 'the far-off, visionary gaze', reflection: 'You see what could be, not only what is.' },
    D: { detail: 'an unidealised face, with lines and imperfections left visible', profile: { reflection: 1, independence: 2 }, quality: 'honesty', shape: 'the unidealised, honest face', reflection: 'You value truth over perfection.' },
    E: { detail: 'a calm, composed expression of quiet certainty', profile: { curiosity: 1, connection: 1, creativity: 1 }, quality: 'sense of purpose', shape: 'the calm, certain expression', reflection: 'You want knowledge to improve lives.' },
    F: { detail: 'a soft, inward expression caught in a private moment', profile: { reflection: 3 }, quality: 'tenderness', shape: 'the soft, inward expression', reflection: 'You find meaning in quiet moments.' }
  },
  4: {
    A: { detail: 'pale golds and dappled morning light', profile: { creativity: 1, reflection: 2 }, quality: 'eye for beauty', shape: 'the pale golds and dappled light', reflection: 'You notice beauty in passing moments.' },
    B: { detail: 'quick flickers of city light in ultramarine and vermilion', profile: { connection: 1, creativity: 1, independence: 1 }, quality: 'spontaneity', shape: 'the flickers of bright city colour', reflection: 'You feel most alive in motion.' },
    C: { detail: 'faded rose, sepia and soft remembered light', profile: { connection: 1, reflection: 2 }, quality: 'nostalgia', shape: 'the faded rose and sepia tones', reflection: 'You hold on to how moments feel.' },
    D: { detail: 'unexpected clashing colour: acid green, violet and orange', profile: { creativity: 2, independence: 1 }, quality: 'daring', shape: 'the unexpected, clashing colours', reflection: 'You find freedom in breaking the rules.' },
    E: { detail: 'warm ochre and brick red under evening lamplight', profile: { connection: 3 }, quality: 'sense of community', shape: 'the warm, lamplit tones', reflection: 'You see beauty in the lives around you.' },
    F: { detail: 'muted greys, soft blue and a single point of light', profile: { reflection: 3 }, quality: 'patience', shape: 'the muted greys and single point of light', reflection: 'You notice what others overlook.' }
  },
  5: {
    A: { detail: 'layered, with traces of earlier marks visible beneath the figure', profile: { connection: 2, reflection: 1 }, quality: 'faithfulness to memory', shape: 'the layered traces of earlier marks beneath you', reflection: 'You carry the past into the future.' },
    B: { detail: 'the figure blending into fine algorithmic patterns', profile: { curiosity: 2, creativity: 1 }, quality: 'curiosity about technology', shape: 'the algorithmic patterns you blend into', reflection: 'You explore what people and machines can make together.' },
    C: { detail: 'the figure set within an invented, carefully constructed world', profile: { creativity: 3 }, quality: 'inventiveness', shape: 'the invented world around you', reflection: 'You want to make what has never existed.' },
    D: { detail: 'an open composition, the figure surrounded by many hands', profile: { connection: 2, creativity: 1 }, quality: 'generosity', shape: 'the many hands surrounding you', reflection: 'You believe creativity grows when it is shared.' },
    E: { detail: 'close and tactile, with visible handmade marks', profile: { creativity: 1, reflection: 1, independence: 1 }, quality: 'respect for craft', shape: 'the close, handmade texture', reflection: 'You protect what makes creativity human.' },
    F: { detail: 'the figure stepping beyond the edge of the frame', profile: { creativity: 2, independence: 1 }, quality: 'boundless imagination', shape: 'the way you step beyond the frame', reflection: 'You want art to be lived, not only seen.' }
  }
};

/**
 * The final reflection: set in the present, not another era. Like every answer it adds to the
 * character profile; it also sets the portrait's mood and layers onto its expression, lighting and composition.
 */
export const FINAL_QUESTION = {
  eyebrow: 'FINAL REFLECTION · THE PERSON BEHIND THE ART',
  title: 'And now,',
  titleEm: 'the artist is you.',
  intro: 'You’ve traveled through five artistic worlds. Every decision has revealed something about how you see, feel, create, and connect.',
  introClosing: 'Now there’s one final choice to make.',
  prompt: 'When someone looks at your portrait, what would you want them to feel?',
  dimension: 'Mood'
};

export type Feeling = {
  id: string;
  title: string;
  description: string;
  /** Points this answer adds to each quality of the character profile. */
  profile: Points;
  /** Shown on the portrait page, and the overall mood in the image prompt. */
  mood: string;
  expression: string;
  lighting: string;
  composition: string;
};

export const FEELINGS: Feeling[] = [
  { id: 'wonder', title: 'A sense of wonder', description: 'There is always more to discover.', profile: { curiosity: 2, creativity: 1 }, mood: 'wondering and expansive', expression: 'eyes lifted, lips slightly parted in quiet amazement', lighting: 'light breaking through from above', composition: 'generous open space around the figure' },
  { id: 'belonging', title: 'A sense of belonging', description: 'We are connected by the stories we share.', profile: { connection: 3 }, mood: 'warm and connected', expression: 'a gentle, welcoming smile', lighting: 'warm, enveloping golden light', composition: 'faint presences of other people at the edges of the frame' },
  { id: 'courage', title: 'A sense of courage', description: 'There is strength in being yourself.', profile: { independence: 3 }, mood: 'bold and unguarded', expression: 'a steady, direct gaze meeting the viewer', lighting: 'strong directional light with deep shadow', composition: 'the figure upright and seen from a slightly low angle' },
  { id: 'peace', title: 'A sense of peace', description: 'Beauty can be found in stillness.', profile: { reflection: 3 }, mood: 'calm and still', expression: 'relaxed features and softly lowered eyes', lighting: 'soft, diffused, even light', composition: 'a balanced, uncluttered frame with plenty of quiet space' },
  { id: 'possibility', title: 'A sense of possibility', description: 'The future is ours to imagine.', profile: { curiosity: 1, creativity: 2 }, mood: 'hopeful and forward-looking', expression: 'a faint smile, gaze turned towards the horizon', lighting: 'dawn light glowing from the distance', composition: 'the figure turned towards an open horizon' },
  { id: 'mystery', title: 'A sense of mystery', description: 'Not everything needs to be explained.', profile: { reflection: 1, independence: 2 }, mood: 'enigmatic and quiet', expression: 'a subtle, unreadable expression, partly in shadow', lighting: 'low light with soft veils of shadow', composition: 'the figure partly hidden, with details left to the imagination' }
];

/** Answers: 'ch1'…'ch5' hold a choice id (A–F); 'final' holds a feeling id. */
export type Answers = Record<string, string>;
export const STEPS = 6;
export const CHAPTERS = 5;
export const chapterKey = (eraId: number) => `ch${eraId}`;

export type MadeChoice = { eraId: EraId; era: Era; choice: Choice; effect: ChoiceEffect };

/** The decisions made so far, in chapter order. */
export function madeChoices(answers: Answers): MadeChoice[] {
  return ERA_IDS.flatMap(eraId => {
    const era = ERAS[eraId - 1];
    const choice = era.choices.find(c => c.id === answers[chapterKey(eraId)]);
    return choice ? [{ eraId, era, choice, effect: EFFECTS[eraId][choice.id] }] : [];
  });
}

export const chosenFeeling = (answers: Answers) => FEELINGS.find(f => f.id === answers.final);

export type PortraitDetail = { label: string; detail: string };

/** Portrait details decided so far, in the order they were made. */
export function portraitDetails(answers: Answers): PortraitDetail[] {
  const details = madeChoices(answers).map(m => ({ label: CHAPTER_DIMENSIONS[m.eraId], detail: m.effect.detail }));
  const feeling = chosenFeeling(answers);
  if (feeling) details.push({ label: FINAL_QUESTION.dimension, detail: `${feeling.mood}: ${feeling.expression}, ${feeling.lighting}` });
  return details;
}

/** Every possible answer at each step, in order: the five chapters, then the final reflection. */
const STEP_OPTIONS: Points[][] = [
  ...ERA_IDS.map(id => Object.values(EFFECTS[id]).map(e => e.profile)),
  FEELINGS.map(f => f.profile)
];

/** Distribution of each quality's raw total across every possible journey (all answers equally likely). */
const DISTRIBUTIONS: Record<Quality, number[]> = Object.fromEntries(QUALITIES.map(q => {
  let dist = [1];
  for (const options of STEP_OPTIONS) {
    const next: number[] = [];
    dist.forEach((p, total) => options.forEach(o => { const v = total + (o[q] || 0); next[v] = (next[v] || 0) + p / options.length; }));
    dist = Array.from(next, v => v || 0);
  }
  return [q, dist];
})) as Record<Quality, number[]>;

/** Raw points for the answers given so far. */
function rawProfile(answers: Answers): Record<Quality, number> {
  const raw = Object.fromEntries(QUALITIES.map(q => [q, 0])) as Record<Quality, number>;
  const feeling = chosenFeeling(answers);
  for (const points of [...madeChoices(answers).map(m => m.effect.profile), ...(feeling ? [feeling.profile] : [])]) {
    for (const q of QUALITIES) raw[q] += points[q] || 0;
  }
  return raw;
}

/**
 * The character profile on a 0–100 scale. A score is the share of all possible journeys that score
 * lower on that quality (ties count half), so 85 means "more than 85% of journeys". This keeps the
 * five qualities comparable even though some come up more often in the answers than others.
 */
export function characterProfile(answers: Answers): Record<Quality, number> {
  const raw = rawProfile(answers);
  return Object.fromEntries(QUALITIES.map(q => {
    const dist = DISTRIBUTIONS[q];
    const below = dist.slice(0, raw[q]).reduce((a, b) => a + b, 0);
    return [q, Math.round(100 * (below + (dist[raw[q]] || 0) / 2))];
  })) as Record<Quality, number>;
}

function correlation(a: number[], b: number[]) {
  const mean = (v: number[]) => v.reduce((x, y) => x + y, 0) / v.length;
  const ma = mean(a), mb = mean(b);
  let num = 0, da = 0, db = 0;
  a.forEach((_, i) => { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; });
  return da && db ? num / Math.sqrt(da * db) : 0;
}

/** Eras ranked by how closely the character profile's pattern matches each archetype's pattern. */
export function rankEras(answers: Answers): EraId[] {
  const profile = characterProfile(answers);
  const values = QUALITIES.map(q => profile[q]);
  const fit = Object.fromEntries(ERA_IDS.map(id => [id, correlation(values, QUALITIES.map(q => ERA_PATTERNS[id][q]))])) as Record<EraId, number>;
  return [...ERA_IDS].sort((a, b) => fit[b] - fit[a] || a - b);
}

export type CharacterProfile = {
  era: Era;
  eraId: EraId;
  archetype: (typeof ARCHETYPES)[EraId];
  feeling: Feeling;
  /** The character profile, 0–100 per quality. */
  scores: Record<Quality, number>;
  /** The highest-scoring quality. */
  coreQuality: string;
  /** How the answers shaped the portrait, built only from the answer-to-portrait mapping. */
  explanation: string[];
  details: PortraitDetail[];
  imagePrompt: string;
};

export function buildProfile(answers: Answers): CharacterProfile | null {
  const made = madeChoices(answers);
  const feeling = chosenFeeling(answers);
  if (made.length < CHAPTERS || !feeling) return null;

  const [eraId] = rankEras(answers);
  const era = ERAS[eraId - 1];
  const archetype = ARCHETYPES[eraId];
  const details = portraitDetails(answers);
  const byLabel = Object.fromEntries(details.map(d => [d.label, d.detail]));

  const scores = characterProfile(answers);
  const coreQuality = QUALITY_LABELS[QUALITIES.reduce((best, q) => scores[q] > scores[best] ? q : best)];

  const e = (id: EraId) => made[id - 1].effect;
  const explanation = [
    `Your ${e(3).quality} inspired ${e(3).shape}, and your ${e(1).quality} became ${e(1).shape}.`,
    `Your ${e(2).quality} shaped ${e(2).shape}, while your ${e(4).quality} chose ${e(4).shape}.`,
    `Your ${e(5).quality} led to ${e(5).shape}, and your wish for others to feel ${feeling.title.toLowerCase()} brought ${feeling.lighting}.`
  ];

  const imagePrompt = [
    `A single-figure portrait in this artistic style: ${era.style}`,
    `The subject has ${byLabel[CHAPTER_DIMENSIONS[3]]}, with ${feeling.expression}.`,
    `Setting: ${byLabel[CHAPTER_DIMENSIONS[2]]}.`,
    `Composition: ${byLabel[CHAPTER_DIMENSIONS[5]]}; ${feeling.composition}.`,
    `Colour: ${byLabel[CHAPTER_DIMENSIONS[4]]}. Lighting: ${feeling.lighting}.`,
    `Include ${byLabel[CHAPTER_DIMENSIONS[1]]} as a meaningful personal symbol.`,
    `The portrait should leave the viewer with ${feeling.title.toLowerCase()}; its mood is ${feeling.mood}.`
  ].join(' ');

  return { era, eraId, archetype, feeling, scores, coreQuality, explanation, details, imagePrompt };
}

/** Image prompt for a chapter's collection artwork: the decision, painted in that chapter's era. */
export function chapterArtPrompt(m: MadeChoice) {
  return `In this artistic style: ${m.era.style} The scene: ${m.era.scene} The decision: ${m.choice.title.toLowerCase()} (${m.choice.description.replace(/\.$/, '')}). Visual focus: ${m.effect.detail}. No people's faces in close-up.`;
}
