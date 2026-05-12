// Edge Function: translate-text
// POST { text: string, target_lang: 'en' | 'pt' }
// Returns { translation: string, source_lang: string }
//
// Lightweight translation endpoint used by the card UI when the user
// long-presses a word/phrase. Powered by the same OpenAI model.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';

const SUPPORTED = new Set(['en', 'pt']);

const translateSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['translation', 'source_lang'],
  properties: {
    translation: { type: 'string', maxLength: 500 },
    source_lang: { type: 'string', maxLength: 16 },
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

  let body: { text?: string; target_lang?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid_json' });
  }
  const text = (body.text ?? '').trim();
  const target = (body.target_lang ?? '').trim();
  if (!text) return json(400, { error: 'text_required' });
  if (text.length > 200) return json(400, { error: 'text_too_long' });
  if (!SUPPORTED.has(target)) return json(400, { error: 'unsupported_target_lang' });

  const targetName = target === 'pt' ? 'Brazilian Portuguese' : 'English';

  const systemPrompt = `You translate a single word or short phrase into ${targetName}. Reply with ONLY the translation (no explanations, no quotes, no source word). If the input is already in ${targetName}, repeat it back unchanged. Detect the source language code (ISO 639-1, e.g. "en", "pt", "es").`;

  const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'translate_response', strict: true, schema: translateSchema },
      },
    }),
  });

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    return json(502, { error: 'openai_error', details: errText.slice(0, 200) });
  }

  const aiJson = await aiRes.json();
  let parsed: { translation: string; source_lang: string };
  try {
    parsed = JSON.parse(aiJson.choices[0].message.content);
  } catch {
    return json(502, { error: 'parse_failed' });
  }

  return json(200, parsed);
});
