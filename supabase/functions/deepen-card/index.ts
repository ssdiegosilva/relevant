// Edge Function: deepen-card
// POST { card_id: string, direction: string }
// Returns { content: string, suggestions: string[] }
//
// Generates a follow-up expansion on a card based on the user's chosen
// direction (one of the suggestion prompts, or a free-form question).
// Stores the result in public.card_deepenings.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';

const deepenSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['content', 'suggestions'],
  properties: {
    content: { type: 'string', maxLength: 1800 },
    suggestions: {
      type: 'array',
      items: { type: 'string', maxLength: 80 },
      minItems: 3,
      maxItems: 4,
    },
  },
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

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

  let body: { card_id?: string; direction?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid_json' });
  }
  const cardId = (body.card_id ?? '').trim();
  const direction = (body.direction ?? '').trim();
  if (!cardId) return json(400, { error: 'card_id_required' });
  if (!direction) return json(400, { error: 'direction_required' });
  if (direction.length > 200) return json(400, { error: 'direction_too_long' });

  // Fetch card (RLS check: user must own it)
  const { data: card, error: cardErr } = await admin
    .from('cards')
    .select('id, user_id, title, content, card_type, source')
    .eq('id', cardId)
    .maybeSingle();
  if (cardErr || !card) return json(404, { error: 'card_not_found' });
  if (card.user_id !== userId) return json(403, { error: 'forbidden' });

  // Fetch prior deepenings on this card so the model sees the trail
  const { data: priorRows } = await admin
    .from('card_deepenings')
    .select('prompt, content')
    .eq('card_id', cardId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(8);
  const prior = priorRows ?? [];

  const priorBlock = prior.length
    ? `\n\nPrior expansions (most recent last):\n${prior
        .map((p, i) => `(${i + 1}) Direction: ${p.prompt}\n${p.content}`)
        .join('\n\n')}`
    : '';

  const systemPrompt = `You are a personalized learning mentor expanding a study card on demand. Stay strictly on the card's topic; deepen, illustrate, contrast, or apply — depending on the direction the reader asked for.

Original card title: ${card.title}
Original card content:
${card.content}${priorBlock}

Rules:
- Treat the reader as a thoughtful adult; skip basics, focus on depth, trade-offs, concrete cases, or practical application.
- If the original card is technical, code examples are great when warranted. If non-technical, use case studies, anecdotes, research findings, frameworks — NOT code.
- Use Markdown. Use code fences ONLY when the content actually warrants code.
- Keep the expansion focused and tight: under 200 words, ideally 80-150.
- Be opinionated and specific. No hedging fluff.
- suggestions: 3 short next-step prompts (≤80 chars each, imperative, varied directions) that build further on what you just wrote. Don't repeat the user's direction; offer new angles.`;

  const userPrompt = `Direction the reader asked for: "${direction}"

Expand the card in that direction.`;

  const t0 = Date.now();
  const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.75,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'deepen_response', strict: true, schema: deepenSchema },
      },
    }),
  });
  const latencyMs = Date.now() - t0;

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    return json(502, { error: 'openai_error', details: errText.slice(0, 200), latencyMs });
  }

  const aiJson = await aiRes.json();
  let parsed: { content: string; suggestions: string[] };
  try {
    parsed = JSON.parse(aiJson.choices[0].message.content);
  } catch {
    return json(502, { error: 'parse_failed' });
  }

  // Persist deepening (RLS: user_id matches auth.uid)
  const { data: stored, error: insErr } = await admin
    .from('card_deepenings')
    .insert({
      user_id: userId,
      card_id: cardId,
      prompt: direction,
      content: parsed.content,
      suggestions: parsed.suggestions,
    })
    .select('id, content, suggestions, created_at')
    .single();

  if (insErr || !stored) {
    return json(500, { error: 'persist_failed', details: insErr?.message });
  }

  // Award XP for deepening (re-use existing add_xp via card_interactions, which
  // triggers add_xp +5 for deepened on the existing trigger).
  await admin.from('card_interactions').insert({
    user_id: userId,
    card_id: cardId,
    action: 'deepened',
  });

  return json(200, {
    id: stored.id,
    content: stored.content,
    suggestions: stored.suggestions,
    created_at: stored.created_at,
  });
});
