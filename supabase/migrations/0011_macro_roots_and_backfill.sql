-- Macro categories: introduce 10 top-level roots so the trail tree groups
-- topics by domain (Tech, Health, Psychology, etc.) instead of dumping every
-- LLM-generated topic into "Other".
--
-- Strategy: simple approach (no reparenting of existing tech sub-roots).
-- The 10 macro roots coexist with the 10 existing seeded tech roots, both
-- top-level. New unverified topics get parent_id pointed at the proper macro.
-- Backfill below maps existing orphan unverified topics whose slug matches
-- a canonical interest from MACRO_CATEGORIES in the RN app constants.

insert into public.topics (slug, name, description, verified) values
  ('tech',                 'Technology',              'Software, infra, AI, mobile, data', true),
  ('health',               'Health',                  'Fitness, sleep, nutrition, longevity', true),
  ('psychology',           'Psychology',              'Habits, emotions, cognition, mental health', true),
  ('career',               'Career',                  'Leadership, hiring, growth, founder skills', true),
  ('finance',              'Finance',                 'Investing, retirement, tax, real estate', true),
  ('productivity',         'Productivity',            'Time, deep work, notes, systems', true),
  ('family-relationships', 'Family & Relationships',  'Parenting, marriage, family life, dating', true),
  ('learning',             'Learning',                'Spaced repetition, languages, deliberate practice', true),
  ('philosophy-culture',   'Philosophy & Culture',    'Stoicism, history, ethics, arts, religion', true),
  ('hobbies-creativity',   'Hobbies & Creativity',    'Cooking, music, sports, photography, crafts', true)
on conflict (slug) do nothing;

-- Backfill: reparent orphan unverified topics that exactly match a canonical
-- interest slug. Anything that doesn't match stays orphan (truly ambiguous).

-- tech
update public.topics
set parent_id = (select id from public.topics where slug = 'tech' and parent_id is null and verified)
where parent_id is null and verified = false
  and slug in (
    'react','next-js','vue','svelte','angular','typescript',
    'css-design-systems','web-performance','accessibility',
    'node-js','python','go','rust','java-kotlin','ruby',
    'ios-swift','android-kotlin','react-native','flutter',
    'postgresql','mongodb','redis','clickhouse','mysql','sqlite',
    'aws','gcp','azure','cloudflare','docker','kubernetes','terraform',
    'llms-ai','prompt-engineering','rag-vector-dbs','machine-learning','fine-tuning',
    'system-design','microservices','event-driven','rest-apis','graphql',
    'ddd','clean-architecture','functional-programming',
    'testing-tdd','observability','security','oauth-owasp','performance','caching',
    'ci-cd','devops-sre','git','linux-bash'
  );

-- health
update public.topics
set parent_id = (select id from public.topics where slug = 'health' and parent_id is null and verified)
where parent_id is null and verified = false
  and slug in (
    'nutrition-basics','macros-calories','micronutrients','hydration-electrolytes','intermittent-fasting',
    'sleep-quality','sleep-hygiene','circadian-rhythm','recovery-sleep-tracking',
    'strength-training','hypertrophy','calisthenics','powerlifting',
    'cardio','zone-2-training','hiit','running','cycling','swimming',
    'mobility','flexibility','yoga','pilates',
    'longevity','healthspan','cognitive-health','cardiovascular-health','bone-joint-health',
    'hormonal-health','metabolic-health','insulin-sensitivity',
    'stress-management','cold-exposure','sauna-heat',
    'gut-health','microbiome','immune-system',
    'supplements','skin-health','bloodwork-interpretation'
  );

-- psychology
update public.topics
set parent_id = (select id from public.topics where slug = 'psychology' and parent_id is null and verified)
where parent_id is null and verified = false
  and slug in (
    'habits-habit-formation','motivation-discipline','willpower','procrastination',
    'emotional-intelligence','self-regulation','self-awareness','self-compassion','resilience',
    'cognitive-biases','mental-models','first-principles','decision-making','memory-cognition',
    'attachment-styles','communication','active-listening','nonviolent-communication','difficult-conversations','boundaries',
    'anxiety','depression-awareness','therapy-basics','cbt-fundamentals','trauma-awareness','burnout-prevention',
    'mindfulness','meditation','breathwork','focus-attention','adhd-strategies',
    'identity-values','shadow-work','imposter-syndrome','perfectionism',
    'loneliness-connection','grief-loss'
  );

-- career
update public.topics
set parent_id = (select id from public.topics where slug = 'career' and parent_id is null and verified)
where parent_id is null and verified = false
  and slug in (
    'leadership','people-management','1-1-conversations','engineering-management','tech-leadership','mentorship',
    'negotiation','salary-negotiation','giving-feedback','receiving-feedback','public-speaking','conference-talks',
    'career-growth','career-ladders','career-transitions','performance-reviews','promotions',
    'personal-branding','linkedin-presence','networking','writing-for-work',
    'hiring-interviewing',
    'product-management','strategy-okrs','customer-development',
    'founder-skills','entrepreneurship','bootstrapping','building-a-saas',
    'remote-async-work','side-projects','freelancing','consulting',
    'office-politics','influence-persuasion',
    'sales-fundamentals','marketing-fundamentals'
  );

-- finance
update public.topics
set parent_id = (select id from public.topics where slug = 'finance' and parent_id is null and verified)
where parent_id is null and verified = false
  and slug in (
    'investing-basics','index-funds','etfs','stock-market','fundamental-analysis',
    'bonds-fixed-income','asset-allocation','portfolio-rebalancing',
    'real-estate-investing','reits','mortgage','buying-a-home',
    'retirement-planning','401k-ira','estate-planning','wills-trusts',
    'tax-planning','tax-optimization',
    'budgeting','cash-flow-management','net-worth-tracking','emergency-fund','saving-rate','debt-management',
    'financial-independence-fire','side-income','passive-income',
    'crypto-fundamentals','bitcoin','ethereum-defi',
    'inflation-macro','interest-rates',
    'generational-wealth','family-financial-planning','money-relationships',
    'behavioral-finance','money-psychology','options-derivatives','life-health-insurance'
  );

-- productivity
update public.topics
set parent_id = (select id from public.topics where slug = 'productivity' and parent_id is null and verified)
where parent_id is null and verified = false
  and slug in (
    'time-management','time-blocking','calendar-mastery','time-tracking','pomodoro',
    'deep-work','flow-state','distraction-management','energy-management',
    'note-taking-systems','zettelkasten','building-a-second-brain','knowledge-management',
    'atomic-habits','saying-no','reading-habits','daily-writing','morning-routines','evening-routines',
    'getting-things-done-gtd','task-prioritization','eisenhower-matrix','email-management','inbox-zero',
    'daily-review','weekly-review','annual-planning','goal-setting','okrs-personal','decision-journals',
    'personal-systems','workflows-automation','project-management-for-individuals','meeting-effectiveness',
    'digital-minimalism'
  );

-- family-relationships
update public.topics
set parent_id = (select id from public.topics where slug = 'family-relationships' and parent_id is null and verified)
where parent_id is null and verified = false
  and slug in (
    'parenting','authoritative-parenting','conscious-parenting','mindful-parenting','discipline-boundaries-with-kids',
    'newborn-infant-care','toddler-care','school-age-kids','teenage-kids','co-parenting',
    'couple-communication','marriage','conflict-resolution','love-languages','couples-therapy-basics','money-conversations-with-partner',
    'family-rituals','family-meetings','quality-time','gratitude-practice','sibling-relationships',
    'education-choices','screen-time',
    'extended-family-in-laws','aging-parents','eldercare',
    'adult-friendships','dating','long-distance-relationships',
    'sexuality-intimacy','fertility-pregnancy','postpartum'
  );

-- learning
update public.topics
set parent_id = (select id from public.topics where slug = 'learning' and parent_id is null and verified)
where parent_id is null and verified = false
  and slug in (
    'spaced-repetition','anki','memory-palace',
    'active-reading','reading-techniques','speed-reading','reading-non-fiction','reading-fiction',
    'languages','english-fluency','spanish',
    'note-taking-methods','cornell-notes','sketchnotes','knowledge-review-systems',
    'feynman-technique','first-principles-thinking','cross-domain-learning',
    'skill-acquisition','deliberate-practice','self-directed-learning','online-courses-moocs',
    'research-skills','writing-to-learn','teaching-to-learn','public-speaking-practice',
    'math-fundamentals','statistics',
    'lifelong-learning'
  );

-- philosophy-culture
update public.topics
set parent_id = (select id from public.topics where slug = 'philosophy-culture' and parent_id is null and verified)
where parent_id is null and verified = false
  and slug in (
    'stoicism','marcus-aurelius','seneca','epictetus',
    'eastern-philosophy','buddhism','taoism',
    'existentialism','modern-philosophy','religion-spirituality',
    'critical-thinking','logic-epistemology','decision-theory','ethics',
    'world-history','ancient-history','modern-history','historical-biographies',
    'political-philosophy','economics','game-theory','sociology','anthropology','geopolitics',
    'literature-classics','art-history','music-appreciation','cinema-film','aesthetics','cultural-studies',
    'news-literacy','polymath-thinking'
  );

-- hobbies-creativity
update public.topics
set parent_id = (select id from public.topics where slug = 'hobbies-creativity' and parent_id is null and verified)
where parent_id is null and verified = false
  and slug in (
    'writing','blogging','newsletters','fiction-writing',
    'drawing','painting','watercolor','calligraphy',
    'photography','phone-photography',
    'music-playing','music-theory','guitar','piano',
    'cooking','baking','sourdough','bbq-grilling','knife-skills','wine','specialty-coffee',
    'camping-backpacking','hiking','astronomy','birdwatching',
    'running-hobby','cycling-hobby','climbing','tennis','golf','surfing',
    'brazilian-jiu-jitsu','boxing','yoga-practice',
    'chess','board-games',
    'woodworking','diy-home-improvement','knitting-crochet',
    'gardening','houseplants',
    'travel','slow-travel',
    'reading-hobby',
    'cars','motorcycles','watches-horology','mechanical-keyboards'
  );
