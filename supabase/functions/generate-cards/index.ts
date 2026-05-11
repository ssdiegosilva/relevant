// Edge Function: generate-cards
// POST { description: string, context?: string, n_cards?: number }
// Returns { session_id, cards: Card[] }

import { createClient } from 'jsr:@supabase/supabase-js@2';

import { MACRO_SLUGS, classifyMacro, type MacroSlug } from '../_shared/macros.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';
const RATE_LIMIT_PER_DAY = Number(Deno.env.get('RATE_LIMIT_PER_DAY') ?? 10);

// Pricing per 1M tokens (gpt-4o-mini default)
const COST_INPUT_PER_M = 0.15;
const COST_OUTPUT_PER_M = 0.60;

const cardsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['cards'],
  properties: {
    cards: {
      type: 'array',
      minItems: 3,
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'title',
          'content',
          'card_type',
          'difficulty',
          'estimated_minutes',
          'topics',
          'macro_category',
        ],
        properties: {
          title: { type: 'string', maxLength: 120 },
          content: { type: 'string', maxLength: 2000 },
          card_type: {
            type: 'string',
            enum: ['concept', 'example', 'best_practice', 'pitfall', 'news'],
          },
          difficulty: { type: 'integer', minimum: 1, maximum: 5 },
          estimated_minutes: { type: 'integer', minimum: 1, maximum: 15 },
          topics: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 4 },
          macro_category: {
            type: 'string',
            enum: [...MACRO_SLUGS],
          },
        },
      },
    },
  },
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json(401, { error: 'missing_auth' });

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userRes.user) return json(401, { error: 'invalid_token' });
  const userId = userRes.user.id;

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let body: { description?: string; context?: string; n_cards?: number; mode?: 'challenge' | 'surprise' | 'side_brain' } = {};
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid_json' });
  }
  const mode = body.mode ?? 'challenge';
  const description = (body.description ?? '').trim();
  if (mode === 'challenge' && !description) return json(400, { error: 'description_required' });
  const nCards = Math.min(Math.max(body.n_cards ?? 3, 3), 5);

  // Rate limit: count successful generations in last 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: usedToday } = await admin
    .from('generation_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'success')
    .gte('created_at', since);
  if ((usedToday ?? 0) >= RATE_LIMIT_PER_DAY) {
    return json(429, { error: 'rate_limit_exceeded', limit: RATE_LIMIT_PER_DAY });
  }

  // Context for prompt
  const { data: profile } = await admin
    .from('profiles')
    .select('role,experience_years,interests,goals')
    .eq('id', userId)
    .maybeSingle();

  const { data: recentTopicRows } = await admin
    .from('card_topics')
    .select('topics(slug,name), cards!inner(user_id)')
    .eq('cards.user_id', userId)
    .order('card_id', { ascending: false })
    .limit(20);
  const recentTopicNames = Array.from(
    new Set((recentTopicRows ?? []).map((r: any) => r.topics?.name).filter(Boolean)),
  ).slice(0, 10);

  // Build challenge label per mode
  const challengeDescription =
    mode === 'surprise'
      ? 'Surprise me — next step on my learning trail'
      : mode === 'side_brain'
        ? 'Side brain — something outside software'
        : description;

  const { data: challenge, error: chErr } = await admin
    .from('challenges')
    .insert({ user_id: userId, description: challengeDescription, context: body.context ?? null })
    .select()
    .single();
  if (chErr || !challenge) return json(500, { error: 'challenge_insert_failed', details: chErr?.message });

  const { data: session, error: sErr } = await admin
    .from('daily_sessions')
    .insert({ user_id: userId, challenge_id: challenge.id })
    .select()
    .single();
  if (sErr || !session) return json(500, { error: 'session_insert_failed', details: sErr?.message });

  const profileLines = [
    profile?.role ? `- Role / field: ${profile.role}` : null,
    profile?.experience_years
      ? `- Experience: ~${profile.experience_years} years in their field`
      : null,
    `- Interests: ${(profile?.interests ?? []).join(', ') || 'general curiosity'}`,
    profile?.goals ? `- Goal: ${profile.goals}` : null,
  ].filter(Boolean);

  const baseProfile = `Learner profile:
${profileLines.join('\n')}

Already studied recently (avoid pure repetition, build on it): ${recentTopicNames.join(', ') || 'none yet'}`;

  const sharedRules = `Hard rules:
- Stay strictly within the user's interests / stated topic. The interests above define what counts as "relevant".
- Match the example style to the domain. If an interest is technical (e.g. React, Postgres, Kubernetes), code examples are great. If an interest is non-technical (e.g. Nutrition, Stoicism, Investing basics, Parenting), use domain-appropriate examples — case studies, frameworks, anecdotes, research findings, practical scenarios. Do NOT default to code unless the domain warrants it.
- Treat the reader as a thoughtful adult. Skip 101 basics. Focus on trade-offs, pitfalls, mental models, advanced patterns, recent insights, concrete practices.
- Mix card_type: include at least one "example" (concrete case, anecdote, code snippet, study, scenario — whichever fits) and at least one "pitfall" or "best_practice".
- Use Markdown. Use code fences ONLY when the content actually warrants code.
- Topic slugs lowercase hyphenated (e.g. "spaced-repetition", "zone-2-training", "compound-interest", "rate-limiting", "stoic-dichotomy-of-control").
- Be opinionated and specific. No hedging fluff. Each card under 250 words.
- macro_category: pick EXACTLY ONE of [tech, health, psychology, career, finance, productivity, family-relationships, learning, philosophy-culture, hobbies-creativity]. This is the trail the card belongs to. Software / engineering / DevOps / data → "tech". Workouts, sleep, nutrition, longevity → "health". Habits, emotions, mental health → "psychology". Leadership, hiring, salary, founder skills → "career". Investing, real estate, retirement, crypto → "finance". Time management, deep work, GTD, note-taking → "productivity". Parenting, marriage, family, dating → "family-relationships". Spaced repetition, languages, memory, deliberate practice → "learning". Stoicism, history, ethics, culture, religion → "philosophy-culture". Cooking, music, sports, photography, travel, crafts → "hobbies-creativity".`;

  let systemPrompt: string;
  let userPrompt: string;

  if (mode === 'surprise') {
    systemPrompt = `You are a personalized learning mentor designing the next step on this learner's trail.

${baseProfile}

Your job: pick ONE specific advanced topic that BUILDS on what they already studied OR fills a strategic gap in their listed interests / goal — something they would not have asked for themselves but that pushes them forward. Then generate ${nCards} cards teaching it.

${sharedRules}

Additional:
- Adjacency-jump from their recent topics (one step further, not far field).
- The first card title should announce the topic clearly.`;
    userPrompt = `Pick one specific advanced topic that fits my interests and recent trail. Generate ${nCards} cards on it.`;
  } else if (mode === 'side_brain') {
    systemPrompt = `You are a polymath mentor helping a curious learner broaden their thinking by exploring a domain OUTSIDE their stated interests.

${baseProfile}

Your job: pick ONE specific topic from a domain DIFFERENT from the learner's listed interests — something they would not naturally encounter, that might unlock a new way of thinking. Vary across calls (don't always pick the same far-field). Then generate ${nCards} cards teaching its core ideas.

Rules:
- Choose ideas that connect in surprising ways to their existing interests (one connection card per session is enough; don't force the analogy in every card).
- Mid-level depth, not 101.
- Mix card_type: include "concept" and "example" with concrete cases or anecdotes.
- Markdown allowed; code fences only when warranted (rare here). Each card under 250 words.
- Topic slugs hyphenated, can be domain terms (e.g. "loss-aversion", "stigmergy", "hick-law", "ikigai", "kintsugi").
- The first card title should announce the topic clearly.`;
    userPrompt = `Pick a topic from a domain different from my listed interests and generate ${nCards} cards. Surprise me with the choice.`;
  } else {
    systemPrompt = `You are a personalized learning mentor creating micro study cards in English.

${baseProfile}

${sharedRules}`;
    userPrompt = `Generate ${nCards} study cards for this challenge:\n\n"${description}"${body.context ? `\n\nExtra context: ${body.context}` : ''}`;
  }

  const t0 = Date.now();
  const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: mode === 'side_brain' ? 0.95 : mode === 'surprise' ? 0.85 : 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'cards_response', strict: true, schema: cardsSchema },
      },
    }),
  });
  const latencyMs = Date.now() - t0;

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    await admin.from('generation_logs').insert({
      user_id: userId,
      session_id: session.id,
      model: MODEL,
      latency_ms: latencyMs,
      status: 'error',
      error_message: errText.slice(0, 500),
    });
    return json(502, { error: 'openai_error', details: errText.slice(0, 200) });
  }

  const aiJson = await aiRes.json();
  const usage = aiJson.usage ?? {};
  const costUsd =
    ((usage.prompt_tokens ?? 0) * COST_INPUT_PER_M + (usage.completion_tokens ?? 0) * COST_OUTPUT_PER_M) /
    1_000_000;

  let parsed: { cards: any[] };
  try {
    parsed = JSON.parse(aiJson.choices[0].message.content);
  } catch (e) {
    await admin.from('generation_logs').insert({
      user_id: userId,
      session_id: session.id,
      model: MODEL,
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      cost_usd: costUsd,
      latency_ms: latencyMs,
      status: 'error',
      error_message: 'parse_failed',
    });
    return json(502, { error: 'parse_failed' });
  }

  // Cache for macro root topic ids (slug -> id), populated lazily per request
  const macroRootIdCache = new Map<MacroSlug, string>();
  const getMacroRootId = async (slug: MacroSlug): Promise<string | null> => {
    const cached = macroRootIdCache.get(slug);
    if (cached) return cached;
    const { data } = await admin
      .from('topics')
      .select('id')
      .eq('slug', slug)
      .is('parent_id', null)
      .eq('verified', true)
      .maybeSingle();
    if (data?.id) {
      macroRootIdCache.set(slug, data.id);
      return data.id;
    }
    return null;
  };

  const userInterests = (profile?.interests ?? []) as string[];

  // Insert cards + match topics
  const insertedCards: any[] = [];
  for (const c of parsed.cards) {
    const hash = await sha256(c.title + '|' + c.content);
    const { data: card, error: cardErr } = await admin
      .from('cards')
      .insert({
        user_id: userId,
        session_id: session.id,
        challenge_id: challenge.id,
        title: c.title,
        content: c.content,
        card_type: c.card_type,
        difficulty: c.difficulty,
        estimated_minutes: c.estimated_minutes,
        source: `openai:${MODEL}`,
        content_hash: hash,
      })
      .select()
      .single();
    if (cardErr || !card) continue;

    // Match topics by slug
    const slugs = (c.topics as string[]).map(slugify).filter(Boolean);
    if (slugs.length) {
      const { data: existingTopics } = await admin
        .from('topics')
        .select('id,slug')
        .in('slug', slugs);
      const existingSlugs = new Set((existingTopics ?? []).map((t) => t.slug));
      const missing = slugs.filter((s) => !existingSlugs.has(s));
      let createdTopics: { id: string; slug: string }[] = [];
      if (missing.length) {
        // Resolve macro parent for these NEW topics only.
        const macroSlug = classifyMacro(c.macro_category, slugs, userInterests);
        const parentId = await getMacroRootId(macroSlug);
        const { data: created } = await admin
          .from('topics')
          .insert(
            missing.map((slug) => ({
              slug,
              name: slug.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
              verified: false,
              parent_id: parentId,
            })),
          )
          .select('id,slug');
        createdTopics = created ?? [];
      }
      const allTopics = [...(existingTopics ?? []), ...createdTopics];
      if (allTopics.length) {
        await admin
          .from('card_topics')
          .insert(allTopics.map((t) => ({ card_id: card.id, topic_id: t.id })));
      }
    }
    insertedCards.push(card);
  }

  await admin
    .from('daily_sessions')
    .update({ card_count: insertedCards.length })
    .eq('id', session.id);

  await admin.from('generation_logs').insert({
    user_id: userId,
    session_id: session.id,
    model: MODEL,
    prompt_tokens: usage.prompt_tokens,
    completion_tokens: usage.completion_tokens,
    cost_usd: costUsd,
    latency_ms: latencyMs,
    status: 'success',
  });

  return json(200, { session_id: session.id, cards: insertedCards });
});
