// Edge Function: generate-cards
// POST { description: string, context?: string, n_cards?: number }
// Returns { session_id, cards: Card[] }

import { createClient } from 'jsr:@supabase/supabase-js@2';

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
        required: ['title', 'content', 'card_type', 'difficulty', 'estimated_minutes', 'topics'],
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

  const baseProfile = `Audience profile:
- Role: ${profile?.role ?? 'software engineer'}
- Experience: ${profile?.experience_years ?? 'unknown'} years
- Interests: ${(profile?.interests ?? []).join(', ') || 'general tech'}
- Goal: ${profile?.goals ?? 'stay current and grow'}

Already studied recently (avoid pure repetition, but build on it): ${recentTopicNames.join(', ') || 'none yet'}`;

  let systemPrompt: string;
  let userPrompt: string;

  if (mode === 'surprise') {
    systemPrompt = `You are a senior software engineering mentor designing the next step on this builder's learning trail.

${baseProfile}

Your job: pick ONE specific advanced topic that BUILDS on what they already studied OR fills a strategic gap for their goal — something they would not have asked for themselves but that pushes them forward. Then generate ${nCards} cards teaching it.

Rules:
- Pick a topic that adjacency-jumps from their recent topics (one step further, not far field)
- Skip basics for experience >= 3 years; focus on trade-offs, pitfalls, advanced patterns, recent updates
- Mix card_type: at least one "example" with code, at least one "pitfall" or "best_practice"
- Markdown with code fences when relevant; each card under 250 words
- Topic slugs lowercase hyphenated (e.g. "rate-limiting", "redis")
- Opinionated and specific; no hedging fluff
- The first card title should announce the topic clearly (e.g. "Backpressure in event-driven systems")`;
    userPrompt = `Surprise me with one specific advanced topic that fits my profile and recent trail. Generate ${nCards} cards on it.`;
  } else if (mode === 'side_brain') {
    systemPrompt = `You are a polymath mentor helping a software engineer broaden their thinking by exploring a domain OUTSIDE software.

${baseProfile}

Your job: pick ONE specific topic from a non-software domain — examples: cognitive science, neuroscience, behavioral economics, design thinking, philosophy, history of science, music theory, biology/evolution, complexity theory, urban planning, art history, linguistics, game theory, systems thinking. Then generate ${nCards} cards teaching its core ideas.

Rules:
- Vary domains across calls — don't always pick cognitive science
- Choose ideas that connect in surprising ways to engineering, product, or systems thinking — but don't force the analogy in every card; one connection card is enough
- For domain experts: pick mid-level depth, not 101
- Mix card_type: include "concept" and "example" with concrete cases or anecdotes
- Markdown allowed; each card under 250 words
- Topic slugs hyphenated, can be domain terms (e.g. "loss-aversion", "stigmergy", "hick-law")
- The first card title should announce the topic clearly (e.g. "Stigmergy: how termites and good codebases self-organize")`;
    userPrompt = `Pick a topic from a non-software domain and generate ${nCards} cards. Surprise me with the choice.`;
  } else {
    systemPrompt = `You are a senior software engineering mentor creating personalized micro study cards in English.

${baseProfile}

Rules:
- Skip basics if experience >= 3 years; focus on trade-offs, pitfalls, advanced patterns, and recent updates
- Mix card_type: include at least one "example" with code, at least one "pitfall" or "best_practice"
- Markdown content with code fences when relevant; keep each card under 250 words
- Topic slugs/names should be concise and lowercase, hyphenated (e.g. "rate-limiting", "redis")
- Be opinionated and specific; no hedging fluff`;
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
        const { data: created } = await admin
          .from('topics')
          .insert(
            missing.map((slug) => ({
              slug,
              name: slug.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
              verified: false,
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
