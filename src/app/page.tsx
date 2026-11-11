'use client';
import { useEffect, useMemo, useState } from 'react';
import { ERAS } from '@/lib/eras';
import { ARCHETYPES, CHAPTERS, CHAPTER_DIMENSIONS, FEELINGS, FINAL_QUESTION, QUALITIES, QUALITY_LABELS, STEPS, buildProfile, chapterArtPrompt, chapterKey, chosenFeeling, madeChoices, portraitDetails, rankEras, type CharacterProfile, type EraId } from '@/lib/quiz';
import type { PortraitSession } from '@/lib/types';

const STORAGE_KEY = 'art-through-you-portrait';
const LEGACY_STORAGE_KEY = 'art-through-you-journey';
const ERA_GLYPHS = ['✳', '◈', '⌁', '〰', '✧'];
/** Marks on the personal collection cards, one per era: zigzag, diamond, circle, wave, four-point star. */
const COLLECTION_MARKS = [
  'M6 30 L18 18 L26 26 L38 14',
  'M22 6 L38 22 L22 38 L6 22 Z',
  'M22 6 A16 16 0 1 1 21.99 6 Z',
  'M4 24 Q11 12 18 22 T32 22 T42 18',
  'M22 4 Q24 20 40 22 Q24 24 22 40 Q20 24 4 22 Q20 20 22 4 Z'
];
const ERA_COLOURS = ['#b65b35', '#d4a64c', '#9c744d', '#7d9b91', '#8c72d9'];

const uid = () => typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `portrait-${Date.now()}`;
/** Stable per-session shuffle, so answer positions don't give away which era they lean towards. */
const optionRank = (seed: string, optionId: string) => { let h = 2166136261; for (const ch of `${seed}:${optionId}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; return h >>> 0; };

const sourceLink = (source: string) => source.split(': https://')[1] ? 'https://' + source.split(': https://')[1] : source;

const HOW_STEPS = [
  { title: 'Travel', description: 'Make one decision in each of five eras of art, then a sixth that brings it back to you.' },
  { title: 'Discover', description: 'Your choices reveal which artistic era resonates with your character.' },
  { title: 'Become art', description: 'Your character is transformed into a unique portrait in your matched style.' }
];

type View = 'home' | 'intro' | 'quiz' | 'results' | 'portrait';

/** Offline stand-in portrait used in demo mode or when image generation fails. */
function makeFallbackPortrait(eraId: EraId, caption: string, seedText: string) {
  const c = ERA_COLOURS[eraId - 1];
  let seed = 0; for (const ch of seedText) seed = (seed * 17 + ch.charCodeAt(0)) % 100;
  const shapes = eraId === 1 ? `<path d="M110 260 Q160 80 240 180 T390 180"/><path d="M190 230 l30 -45 30 45"/><circle cx="300" cy="140" r="36"/>`
    : eraId === 2 ? `<path d="M100 90 H400 V330 H100 Z"/><path d="M140 280 L250 100 L360 280 Z"/><circle cx="250" cy="180" r="42"/>`
    : eraId === 3 ? `<path d="M90 330 L180 90 L330 90 L410 330 Z"/><path d="M170 300 Q250 100 330 300"/><circle cx="250" cy="145" r="38"/>`
    : eraId === 4 ? `<path d="M60 250 Q140 90 220 220 T420 180"/><circle cx="155" cy="135" r="60"/><path d="M80 300 Q210 230 400 310"/>`
    : `<circle cx="250" cy="205" r="110"/><path d="M250 55 L300 205 L250 355 L200 205 Z"/><path d="M100 205 L250 155 L400 205 L250 255 Z"/>`;
  const safeCaption = caption.replace(/[<>&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${c}"/><stop offset="1" stop-color="#201b1a"/></linearGradient><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3"/><feColorMatrix values=".4 0 0 0 0 .3 .2 0 0 0 .2 0 .2 0 0 0 0 0 .13 0"/></filter></defs><rect width="500" height="500" fill="url(#g)"/><g transform="translate(0 30)" fill="none" stroke="#f1d8a5" stroke-width="${eraId === 1 ? 13 : 5}" stroke-linecap="round" stroke-linejoin="round" opacity=".9">${shapes}</g><g fill="#f4dfb9" opacity=".7"><circle cx="${seed + 65}" cy="70" r="5"/><circle cx="${seed + 355}" cy="410" r="8"/></g><rect width="500" height="500" filter="url(#n)" opacity=".22"/><text x="250" y="465" font-family="Georgia" font-size="15" letter-spacing="2" text-anchor="middle" fill="#fff1d8" opacity=".8">${safeCaption}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function Home() {
  const [session, setSession] = useState<PortraitSession | null>(null);
  /** Optional photo for a resemblance-guided portrait. Held in memory only; never saved. */
  const [photo, setPhoto] = useState('');
  const [name, setName] = useState('');
  const [view, setView] = useState<View>('home');
  const [notice, setNotice] = useState('');
  const [aiMode, setAiMode] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const s = JSON.parse(saved) as PortraitSession;
        // Older saves stored a chapter number as the final answer; send those visitors back to the final reflection.
        if (s.answers.final && !chosenFeeling(s.answers)) { const { final: _old, ...answers } = s.answers; Object.assign(s, { answers, step: STEPS - 1, completed: false, portraitUrl: undefined }); }
        setSession(s); setName(s.name);
      }
    } catch { try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ } }
  }, []);
  useEffect(() => {
    if (!session) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); }
    catch {
      // Images can exceed the storage quota; keep the journey itself and drop the collection artworks.
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session, chapterArt: undefined })); } catch { /* storage unavailable */ }
    }
  }, [session]);

  const profile = useMemo(() => session ? buildProfile(session.answers) : null, [session?.answers]);
  const step = session?.step ?? 0;
  const isFinal = step === STEPS - 1;
  const chapter = ERAS[Math.min(step, 4)];
  const stepKey = isFinal ? 'final' : chapterKey(chapter.id);
  const made = session ? madeChoices(session.answers) : [];
  const sofar = session ? portraitDetails(session.answers) : [];
  const leadingEra = made.length ? rankEras(session!.answers)[0] : null;

  const start = () => {
    const s: PortraitSession = { id: uid(), name: name.trim() || 'Traveller', answers: {}, step: 0, completed: false, createdAt: new Date().toISOString() };
    setSession(s); setPhoto(''); setNotice(''); setView('intro');
  };
  const resume = () => {
    if (!session) return;
    setNotice(''); setView(session.completed ? 'portrait' : 'quiz');
  };
  const reset = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ }
    setSession(null); setName(''); setPhoto(''); setNotice(''); setView('home');
  };

  const choose = (optionId: string) => {
    setSession(cur => cur && { ...cur, answers: { ...cur.answers, [stepKey]: optionId } });
  };
  const goBack = () => {
    if (!session) return;
    if (session.step === 0) setView('intro'); else setSession(cur => cur && { ...cur, step: cur.step - 1 });
  };
  const goNext = () => {
    if (!session || !session.answers[stepKey]) return;
    if (!isFinal) void paintChapter(session, chapter.id);
    if (session.step < STEPS - 1) { setSession(cur => cur && { ...cur, step: cur.step + 1 }); return; }
    const finished: PortraitSession = { ...session, completed: true, portraitUrl: undefined, portraitSource: undefined, portraitFromPhoto: false };
    setSession(finished); setView('results'); void generatePortrait(finished);
  };

  /** Paints a chapter's collection artwork in the background. Failures are silent; the card falls back to the era's mark. */
  const paintChapter = async (s: PortraitSession, eraId: number) => {
    const m = madeChoices(s.answers).find(x => x.eraId === eraId);
    if (!m || !aiMode || s.chapterArt?.[eraId]?.choiceId === m.choice.id) return;
    const data = await fetch('/api/artwork', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: chapterArtPrompt(m) })
    }).then(r => r.ok ? r.json() : null).catch(() => null);
    if (typeof data?.dataUrl !== 'string') return;
    setSession(cur => cur && cur.id === s.id && cur.answers[chapterKey(eraId)] === m.choice.id
      ? { ...cur, chapterArt: { ...cur.chapterArt, [eraId]: { choiceId: m.choice.id, url: data.dataUrl } } } : cur);
  };

  /** Paints the main portrait, guided by the optional photo when one has been added. */
  const generatePortrait = async (s: PortraitSession, withPhoto = photo) => {
    const p = buildProfile(s.answers);
    if (!p) return;
    const fallback = makeFallbackPortrait(p.eraId, p.archetype.title.toUpperCase(), s.id);
    const update = (fn: (cur: PortraitSession) => PortraitSession) => setSession(cur => cur && cur.id === s.id ? fn(cur) : cur);
    if (!aiMode) { update(cur => ({ ...cur, portraitUrl: fallback, portraitSource: 'demo', portraitFromPhoto: false })); return; }

    setGenerating(true);
    const data = await fetch(withPhoto ? '/api/portrait-photo' : '/api/artwork', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withPhoto ? { prompt: p.imagePrompt, photo: withPhoto } : { prompt: p.imagePrompt })
    }).then(r => r.ok ? r.json() : null).catch(() => null);
    if (typeof data?.dataUrl === 'string') {
      update(cur => ({ ...cur, portraitUrl: data.dataUrl, portraitSource: 'ai', portraitFromPhoto: !!withPhoto }));
    } else if (withPhoto) {
      // Keep whatever portrait is already there; only fall back to a preview if there is none.
      update(cur => cur.portraitUrl ? cur : { ...cur, portraitUrl: fallback, portraitSource: 'unavailable', portraitFromPhoto: false });
      setPhoto('');
      setNotice('The portrait service couldn’t use your photo right now. Your photo was not saved.');
    } else {
      update(cur => ({ ...cur, portraitUrl: fallback, portraitSource: 'unavailable', portraitFromPhoto: false }));
    }
    setGenerating(false);
  };

  /** Reads, centre-crops and downsizes the photo before it is sent; the original never leaves the device. */
  const handlePhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !session) return;
    if (!aiMode) { setNotice('Switch on AI mode at the top of the page to paint from a photo.'); return; }
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { setNotice('Please choose a JPEG, PNG or WebP photo.'); return; }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const size = 512, side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
      canvas.getContext('2d')!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(objectUrl);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPhoto(dataUrl);
      void generatePortrait(session, dataUrl);
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); setNotice('That photo couldn’t be read. Please try another.'); };
    img.src = objectUrl;
  };
  const removePhoto = () => { setPhoto(''); if (session) void generatePortrait(session, ''); };

  /** Shares the story (with the portrait when the device supports file sharing), or copies it as a fallback. */
  const shareStory = async () => {
    if (!session || !profile) return;
    const url = window.location.origin;
    const text = `${profile.archetype.title.replace(/\b\w/g, c => c.toUpperCase())}: my story in art found its home in ${profile.archetype.era === 'Renaissance' ? 'the Renaissance' : profile.archetype.era}. Discover yours with Art Through You.`;
    try {
      if (navigator.share) {
        const data: ShareData = { title: 'Art Through You', text, url };
        if (session.portraitUrl) {
          const blob = await (await fetch(session.portraitUrl)).blob();
          const file = new File([blob], portraitFile(session, profile), { type: blob.type });
          if (navigator.canShare?.({ files: [file] })) data.files = [file];
        }
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setNotice('Your story was copied. Paste it anywhere to share it.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return; // the visitor closed the share sheet
      setNotice('Sharing isn’t available here. Download your portrait to share it instead.');
    }
  };

  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="#top" onClick={e => { e.preventDefault(); setView('home'); }}><span className="brand-mark">a.</span><span>ART THROUGH YOU</span></a><div className="top-right"><span className="edition">DISCOVER YOURSELF THROUGH ART</span><button className="text-button" onClick={() => setAiMode(!aiMode)} title="Toggle optional AI API mode">{aiMode ? 'AI MODE ON' : 'DEMO MODE'}</button></div></header>

    {view === 'home' && <section className="hero" id="top"><div className="hero-copy"><p className="eyebrow">FIVE ERAS. SIX CHOICES. ONE PORTRAIT OF YOU.</p><h1>What if art could<br />reveal <em>who you are</em>?</h1><p className="hero-lede">Travel through the history of art, making decisions that reveal what you value, how you see the world, and what you choose to leave behind. Each decision shapes your character. At the end, discover the artistic era that reflects your choices and see yourself transformed into a unique work of art.</p><div className="hero-actions"><div className="name-field"><label htmlFor="visitor">YOUR NAME</label><input id="visitor" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" maxLength={32} /></div><button className="primary-button" onClick={session ? resume : start}>{session ? (session.completed ? 'View your portrait' : 'Continue your journey') : 'Discover your portrait'} <span>↗</span></button></div><div className="hero-note">NO ACCOUNT NEEDED · SIX CHOICES · ABOUT 3–5 MINUTES{session && <> · <button className="inline-link" onClick={reset}>START OVER</button></>}</div></div><div className="hero-art"><div className="art-frame"><div className="frame-top">FIG. 01 — THE ART OF BEING YOU</div><div className="collage"><div className="collage-disc" /><div className="collage-line" /><div className="collage-hand">✳</div><div className="collage-caption">Every personality<br />is a masterpiece.</div></div><div className="frame-bottom"><span>YOUR CHARACTER → YOUR PORTRAIT</span></div></div><div className="floating-note">A PERSONAL<br />VISUAL HISTORY <span>✳</span></div></div><div className="hero-bottom"><span>SCROLL TO EXPLORE</span><span>↓</span><span>AN EXPERIENCE IN BECOMING</span></div></section>}

    {view === 'home' && <section className="how-section"><div className="section-heading"><div><p className="eyebrow">HOW IT WORKS</p><h2>A portrait shaped<br />by your choices.</h2></div></div><ol className="how-steps">{HOW_STEPS.map((step, i) => <li className="how-step" key={step.title}><span className="how-number">0{i + 1}</span><h3>{step.title}</h3><p>{step.description}</p></li>)}</ol></section>}

    {view === 'home' && <section className="eras-section"><div className="section-heading"><div><p className="eyebrow">THE FIVE ARTISTIC WORLDS</p><h2>Five eras.<br />Five ways to express you.</h2></div><p>Your answers will reveal the artistic world that best reflects your character. Each era offers a different way of seeing and expressing who you are.</p></div><div className="era-strip">{ERAS.map((e, i) => { const a = ARCHETYPES[e.id as EraId]; return <article className="era-tile" key={e.id}><div className={`era-thumb era-${e.id}`}>{e.image ? <img src={e.image} alt={e.imageAlt} style={{ objectPosition: e.imagePosition }} /> : <b>{ERA_GLYPHS[i]}</b>}<span>0{i + 1}</span></div><p className="era-period">0{i + 1} — {a.era}</p><h3>{a.title}</h3><p>{a.description}</p></article>; })}</div></section>}

    {view === 'intro' && session && <section className="stage-view"><div className="stage-copy"><p className="eyebrow">YOUR STORY BEGINS HERE</p><h1>Every choice adds<br /><em>a brushstroke.</em></h1><p className="stage-lede">Six choices. No right or wrong answers. Just the little things that make you who you are.</p><p className="stage-closing">Let&apos;s discover your artistic self.</p><button className="primary-button" onClick={() => setView('quiz')}>Begin <span>↗</span></button></div></section>}

    {view === 'quiz' && session && <section className="chapter-view">
      <div className="chapter-top"><button className="back-link" onClick={() => setView('home')}>← OVERVIEW</button><span>{isFinal ? 'FINAL REFLECTION' : `CHAPTER ${String(step + 1).padStart(2, '0')} / 0${CHAPTERS}`}</span><span>{session.name.toUpperCase()}</span></div>
      <div className="progress-track quiz-progress">{Array.from({ length: STEPS }, (_, i) => <div key={i} className={i < step || (i === step && session.answers[stepKey]) ? 'filled' : ''} />)}</div>
      <div className="chapter-grid">
        {!isFinal ? <div className="chapter-copy">
          <p className="eyebrow">CHAPTER {String(chapter.id).padStart(2, '0')} — {chapter.name.toUpperCase()}</p>
          <p className="period-label">{chapter.period.toUpperCase()} · {chapter.eyebrow}</p>
          <h1>{chapter.title}<br /><em>{chapter.titleEm}</em></h1>
          <p className="chapter-intro">{chapter.intro}</p>
          <div className="scene-box"><span>THE MOMENT</span><p>{chapter.scene}</p></div>
          <div className="choice-heading"><span>THE QUESTION</span><span>SHAPES YOUR PORTRAIT&apos;S {CHAPTER_DIMENSIONS[chapter.id as EraId].toUpperCase()}</span></div>
          <p className="chapter-question">{chapter.question}</p>
          <div className="choices" role="radiogroup" aria-label={chapter.question}>
            {[...chapter.choices].sort((a, b) => optionRank(session.id + chapter.id, a.id) - optionRank(session.id + chapter.id, b.id)).map((c, i) => {
              const chosen = session.answers[stepKey] === c.id;
              return <button key={c.id} role="radio" aria-checked={chosen} className={`choice ${chosen ? 'chosen' : ''}`} onClick={() => choose(c.id)}><span className="choice-id">{String.fromCharCode(65 + i)}</span><span className="choice-text"><b>{c.title}</b><small>{c.description}</small></span><span className="choice-arrow">{chosen ? '●' : '↗'}</span></button>;
            })}
          </div>
          <div className="quiz-nav"><button className="secondary-button" onClick={goBack}>← Back</button><button className="primary-button" disabled={!session.answers[stepKey]} onClick={goNext}>Make this choice <span>↗</span></button></div>
          <p className="chapter-footnote">{chapter.choices.find(c => c.id === session.answers[stepKey])?.consequence || 'There are no right or wrong answers. Your decision becomes part of the character you carry forward.'}</p>
        </div> : <div className="chapter-copy">
          <p className="eyebrow">{FINAL_QUESTION.eyebrow}</p>
          <p className="period-label">THE PRESENT</p>
          <h1>{FINAL_QUESTION.title}<br /><em>{FINAL_QUESTION.titleEm}</em></h1>
          <p className="chapter-intro">{FINAL_QUESTION.intro}</p>
          <p className="chapter-intro final-closing">{FINAL_QUESTION.introClosing}</p>
          <div className="choice-heading"><span>THE QUESTION</span><span>SHAPES YOUR PORTRAIT&apos;S {FINAL_QUESTION.dimension.toUpperCase()}</span></div>
          <p className="chapter-question">{FINAL_QUESTION.prompt}</p>
          <div className="choices" role="radiogroup" aria-label={FINAL_QUESTION.prompt}>
            {[...FEELINGS].sort((a, b) => optionRank(session.id + 'final', a.id) - optionRank(session.id + 'final', b.id)).map((f, i) => {
              const chosen = session.answers.final === f.id;
              return <button key={f.id} role="radio" aria-checked={chosen} className={`choice ${chosen ? 'chosen' : ''}`} onClick={() => choose(f.id)}><span className="choice-id">{String.fromCharCode(65 + i)}</span><span className="choice-text"><b>{f.title}</b><small>{f.description}</small></span><span className="choice-arrow">{chosen ? '●' : '↗'}</span></button>;
            })}
          </div>
          <div className="quiz-nav"><button className="secondary-button" onClick={goBack}>← Back</button><button className="primary-button" disabled={!session.answers.final} onClick={goNext}>Finish my portrait <span>↗</span></button></div>
          <p className="chapter-footnote">Your answer sets your portrait&apos;s mood, and shapes its expression, lighting and composition.</p>
        </div>}
        <div className="chapter-visual">
          {!isFinal ? <EraPanel eraId={chapter.id} label={chapter.name.toUpperCase()} />
            : <div className={`visual-art ${leadingEra ? `visual-${leadingEra}` : ''}`}><div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" /><div className="visual-core">✳</div><div className="visual-label">THE PRESENT · YOUR PORTRAIT AWAITS</div></div>}
          <div className="visual-caption"><span>YOUR PORTRAIT SO FAR</span>
            {sofar.length === 0 ? <p>Each decision adds a brushstroke to your portrait: its symbol, setting, expression, colour and composition. Your final reflection sets its mood.</p>
              : <ul className="sofar-list">{sofar.map(d => <li key={d.label}><span>{d.label}</span>{d.detail}</li>)}</ul>}
          </div>
          {!isFinal && <div className="history-note"><span>HISTORICAL NOTE</span><p>{chapter.fact}</p><a href={sourceLink(chapter.source)} target="_blank" rel="noreferrer">Explore a reference ↗</a></div>}
        </div>
      </div>
    </section>}

    {view === 'results' && session && <section className="stage-view"><div className="stage-copy"><p className="eyebrow">SIX CHOICES. ONE UNIQUE STORY.</p><h1>Every choice was<br /><em>a brushstroke.</em></h1><p className="stage-lede">Across five artistic eras, your decisions revealed what you value, how you see the world, and what you want to leave behind.</p><p className="stage-closing">Now, those choices become a portrait that&apos;s uniquely yours.</p><button className="primary-button" onClick={() => setView('portrait')}>Reveal my portrait <span>↗</span></button><p className="stage-status" role="status">{generating || !session.portraitUrl ? 'YOUR STORY IS COMPLETE · YOUR PORTRAIT IS BEING PAINTED'
      : session.portraitSource === 'ai' ? 'YOUR PORTRAIT IS READY'
      : session.portraitSource === 'demo' ? 'YOUR STORY IS COMPLETE · DEMO MODE, SO YOU’LL SEE A PREVIEW OF YOUR PORTRAIT'
      : 'YOUR STORY IS COMPLETE · THE PORTRAIT SERVICE IS UNAVAILABLE RIGHT NOW, SO YOU’LL SEE A PREVIEW'}</p></div></section>}

    {view === 'portrait' && session && profile && <PortraitView
      session={session} profile={profile} generating={generating}
      onRegenerate={() => void generatePortrait(session)} onReset={reset} onShare={() => void shareStory()}
      hasPhoto={!!photo} onPhoto={handlePhoto} onRemovePhoto={removePhoto}
    />}

    {notice && <div className="toast" role="status"><span>✳</span>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
    <footer className="footer"><a className="brand" href="#top" onClick={e => { e.preventDefault(); setView('home'); }}><span className="brand-mark">a.</span><span>ART THROUGH YOU</span></a><span>AN EXPERIMENT IN PERSONAL STORYTELLING & ART</span><span>© 2026</span></footer>
  </main>;
}

/** The large era panel beside each chapter: the era's reference image, or its gradient and mark until one is set. */
function EraPanel({ eraId, label }: { eraId: number; label: string }) {
  const era = ERAS[eraId - 1];
  return <div className={`visual-art visual-${eraId} ${era.image ? 'has-image' : ''}`}>
    {era.image ? <img src={era.image} alt={era.imageAlt} style={{ objectPosition: era.imagePosition }} />
      : <><div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" /><div className="visual-core">{ERA_GLYPHS[eraId - 1]}</div></>}
    <div className="visual-label">{label}</div>
  </div>;
}

function portraitFile(session: PortraitSession, profile: CharacterProfile) {
  const ext = session.portraitUrl?.startsWith('data:image/svg') ? 'svg' : 'jpg';
  return `art-through-you-${profile.archetype.era.toLowerCase().replace(/[^a-z]+/g, '-')}.${ext}`;
}

function PortraitView(props: {
  session: PortraitSession; profile: CharacterProfile; generating: boolean;
  onRegenerate: () => void; onReset: () => void; onShare: () => void;
  hasPhoto: boolean; onPhoto: (e: React.ChangeEvent<HTMLInputElement>) => void; onRemovePhoto: () => void;
}) {
  const { session, profile, generating } = props;
  const { era, archetype } = profile;
  const made = madeChoices(session.answers);
  const portraitFileName = portraitFile(session, profile);
  return <section className="portrait-view">
    {/* Part A — artistic identity */}
    <div className="gallery-header"><p className="eyebrow">YOUR ARTISTIC IDENTITY</p><h1>{session.name},<br /><em>this is your story <span className="nowrap">in art.</span></em></h1><p>Five eras. Six decisions. One character shaped by the choices you made.</p></div>
    <div className="identity-card">
      <h2>{archetype.title.replace(/\b\w/g, c => c.toUpperCase())}</h2>
      <p>{archetype.interpretation}</p>
      <div className="profile-bars"><span>YOUR CHARACTER PROFILE</span>
        <ul>{QUALITIES.map(q => <li key={q}><b>{QUALITY_LABELS[q]}</b><i><em style={{ width: `${profile.scores[q]}%` }} /></i><small>{profile.scores[q]}/100</small></li>)}</ul>
      </div>
      <dl><div><dt>Matched era</dt><dd>{archetype.era}</dd></div><div><dt>Core quality</dt><dd>{profile.coreQuality}</dd></div></dl>
    </div>

    {/* Part B — the generated portrait */}
    <section className="portrait-section">
      <div className="portrait-intro"><p className="eyebrow">THE ART OF BEING YOU</p><h2>A portrait shaped<br /><em>by your choices.</em></h2><p>Your character, interpreted through the artistic language of the era that reflects you most.</p></div>
      <figure className="portrait-frame">
        <div className="frame-top"><span>FIG. 01 — {session.name.toUpperCase()}</span><span>{archetype.era.toUpperCase()}</span></div>
        <div className="portrait-canvas">
          {session.portraitUrl ? <img src={session.portraitUrl} alt={`${archetype.era}-inspired portrait of ${session.name}`} />
            : <div className={`visual-art visual-${profile.eraId}`}><div className="visual-orbit orbit-one" /><div className="visual-core">{ERA_GLYPHS[profile.eraId - 1]}</div><div className="visual-label">{generating ? 'PAINTING YOUR PORTRAIT…' : 'PORTRAIT PENDING'}</div></div>}
        </div>
        <figcaption className="frame-bottom"><span>YOUR CHARACTER → YOUR PORTRAIT</span><span>{session.portraitSource === 'ai' ? (session.portraitFromPhoto ? 'FROM YOUR PHOTO' : era.period.toUpperCase()) : session.portraitUrl ? 'PREVIEW' : ''}</span></figcaption>
      </figure>
      {!generating && session.portraitSource === 'unavailable' && <div className="service-note" role="status"><b>Your journey is complete, and your results are saved.</b> The portrait service isn&apos;t available right now, so this is a preview in your era&apos;s style. <button className="inline-link" onClick={props.onRegenerate}>Try painting again</button></div>}
      {!generating && session.portraitSource === 'demo' && <div className="service-note" role="status"><b>Your journey is complete.</b> You&apos;re in demo mode, so this is a preview in your era&apos;s style. Switch on AI mode at the top of the page, then paint your portrait.</div>}
      <div className="portrait-explanation"><span>HOW YOUR CHOICES SHAPED IT</span><p>{profile.explanation.join(' ')}</p></div>
      <div className="portrait-actions">
        <button className="secondary-button" onClick={props.onRegenerate} disabled={generating}>{generating ? 'Painting…' : session.portraitSource === 'ai' ? 'Paint another version' : 'Paint my portrait'}</button>
      </div>
      <div className="photo-option">
        <span>OPTIONAL · ADD A PHOTO</span>
        <p>Uploading a photo is optional. It helps your portrait resemble you, while your choices still decide its style, mood and details. Your photo is sent to the image service for this one request and is never saved.</p>
        <div><label className={`upload-button ${generating ? 'is-disabled' : ''}`}>{props.hasPhoto ? 'Use a different photo' : 'Add a photo'}<input type="file" accept="image/jpeg,image/png,image/webp" capture="user" disabled={generating} onChange={props.onPhoto} /></label>
        {props.hasPhoto && <button className="secondary-button" onClick={props.onRemovePhoto} disabled={generating}>Paint without my photo</button>}</div>
      </div>
    </section>

    {/* Part C — the journey through art */}
    <section className="collection-section">
      <div className="section-heading"><div><p className="eyebrow">YOUR PERSONAL COLLECTION</p><h2>Five moments<br />that made you.</h2></div><p>Every decision left a mark. Together, they tell the story behind your portrait.</p></div>
      <div className="era-strip">{made.map(m => <article className="era-tile collection-card" key={m.eraId}>
        <div className={`era-thumb era-${m.eraId}`}>{session.chapterArt?.[m.eraId]?.choiceId === m.choice.id
          ? <img src={session.chapterArt[m.eraId].url} alt={`${m.era.name}: ${m.choice.title}`} />
          : <svg className="collection-mark" viewBox="0 0 44 44" aria-hidden="true"><path d={COLLECTION_MARKS[m.eraId - 1]} /></svg>}</div>
        <p className="era-period">0{m.eraId} · {m.era.name}</p>
        <h3>{m.choice.title}</h3>
        <p>{m.effect.reflection}</p>
      </article>)}</div>
    </section>

    {/* Closing */}
    <section className="gallery-end closing-section">
      <p className="eyebrow">THE STORY CONTINUES</p>
      <h2>Art changes.<br /><em>What you carry remains.</em></h2>
      <p>Across centuries, art has changed the way we express ourselves. But every image begins with something human: a memory, a feeling, a question, a choice.</p>
      <p className="closing-line">This is yours.</p>
      <div className="gallery-actions">
        {session.portraitUrl && <a className="primary-button" href={session.portraitUrl} download={portraitFileName}>Download my portrait <span>↗</span></a>}
        <button className="secondary-button" onClick={props.onShare}>Share my story</button>
        <button className="secondary-button" onClick={props.onReset}>Begin a new journey</button>
      </div>
    </section>
  </section>;
}
