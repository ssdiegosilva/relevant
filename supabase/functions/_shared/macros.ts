// Trail / macro classification source-of-truth for the edge function.
//
// This mirrors a SUBSET of `src/features/profile/constants.ts`
// (the RN MACRO_CATEGORIES constant). Only the slug → macro lookup is
// duplicated here, not the icons or group display names.
//
// Keep in sync MANUALLY whenever an interest is added/renamed in
// the RN constants. See verification step 3 in the plan.

export const MACRO_SLUGS = [
  'tech',
  'health',
  'psychology',
  'career',
  'finance',
  'productivity',
  'family-relationships',
  'learning',
  'philosophy-culture',
  'hobbies-creativity',
] as const;

export type MacroSlug = (typeof MACRO_SLUGS)[number];

const INTEREST_BY_MACRO: Record<MacroSlug, string[]> = {
  tech: [
    'React', 'Next.js', 'Vue', 'Svelte', 'Angular', 'TypeScript',
    'CSS / Design systems', 'Web performance', 'Accessibility',
    'Node.js', 'Python', 'Go', 'Rust', 'Java / Kotlin', 'Ruby',
    'iOS / Swift', 'Android / Kotlin', 'React Native', 'Flutter',
    'PostgreSQL', 'MongoDB', 'Redis', 'ClickHouse', 'MySQL', 'SQLite',
    'AWS', 'GCP', 'Azure', 'Cloudflare', 'Docker', 'Kubernetes', 'Terraform',
    'LLMs / AI', 'Prompt engineering', 'RAG / Vector DBs', 'Machine learning', 'Fine-tuning',
    'System design', 'Microservices', 'Event-driven', 'REST APIs', 'GraphQL',
    'DDD', 'Clean architecture', 'Functional programming',
    'Testing & TDD', 'Observability', 'Security', 'OAuth / OWASP', 'Performance', 'Caching',
    'CI/CD', 'DevOps / SRE', 'Git', 'Linux / Bash',
  ],
  health: [
    'Nutrition basics', 'Macros & calories', 'Micronutrients', 'Hydration & electrolytes', 'Intermittent fasting',
    'Sleep quality', 'Sleep hygiene', 'Circadian rhythm', 'Recovery & sleep tracking',
    'Strength training', 'Hypertrophy', 'Calisthenics', 'Powerlifting',
    'Cardio', 'Zone 2 training', 'HIIT', 'Running', 'Cycling', 'Swimming',
    'Mobility', 'Flexibility', 'Yoga', 'Pilates',
    'Longevity', 'Healthspan', 'Cognitive health', 'Cardiovascular health', 'Bone & joint health',
    'Hormonal health', 'Metabolic health', 'Insulin sensitivity',
    'Stress management', 'Cold exposure', 'Sauna / heat',
    'Gut health', 'Microbiome', 'Immune system',
    'Supplements', 'Skin health', 'Bloodwork interpretation',
  ],
  psychology: [
    'Habits & habit formation', 'Motivation & discipline', 'Willpower', 'Procrastination',
    'Emotional intelligence', 'Self-regulation', 'Self-awareness', 'Self-compassion', 'Resilience',
    'Cognitive biases', 'Mental models', 'First principles', 'Decision making', 'Memory & cognition',
    'Attachment styles', 'Communication', 'Active listening', 'Nonviolent Communication', 'Difficult conversations', 'Boundaries',
    'Anxiety', 'Depression awareness', 'Therapy basics', 'CBT fundamentals', 'Trauma awareness', 'Burnout prevention',
    'Mindfulness', 'Meditation', 'Breathwork', 'Focus & attention', 'ADHD strategies',
    'Identity & values', 'Shadow work', 'Imposter syndrome', 'Perfectionism',
    'Loneliness & connection', 'Grief & loss',
  ],
  career: [
    'Leadership', 'People management', '1:1 conversations', 'Engineering management', 'Tech leadership', 'Mentorship',
    'Negotiation', 'Salary negotiation', 'Giving feedback', 'Receiving feedback', 'Public speaking', 'Conference talks',
    'Career growth', 'Career ladders', 'Career transitions', 'Performance reviews', 'Promotions',
    'Personal branding', 'LinkedIn presence', 'Networking', 'Writing for work',
    'Hiring & interviewing',
    'Product management', 'Strategy & OKRs', 'Customer development',
    'Founder skills', 'Entrepreneurship', 'Bootstrapping', 'Building a SaaS',
    'Remote / async work', 'Side projects', 'Freelancing', 'Consulting',
    'Office politics', 'Influence & persuasion',
    'Sales fundamentals', 'Marketing fundamentals',
  ],
  finance: [
    'Investing basics', 'Index funds', 'ETFs', 'Stock market', 'Fundamental analysis',
    'Bonds & fixed income', 'Asset allocation', 'Portfolio rebalancing',
    'Real estate investing', 'REITs', 'Mortgage', 'Buying a home',
    'Retirement planning', '401k / IRA', 'Estate planning', 'Wills & trusts',
    'Tax planning', 'Tax optimization',
    'Budgeting', 'Cash flow management', 'Net worth tracking', 'Emergency fund', 'Saving rate', 'Debt management',
    'Financial independence (FIRE)', 'Side income', 'Passive income',
    'Crypto fundamentals', 'Bitcoin', 'Ethereum / DeFi',
    'Inflation & macro', 'Interest rates',
    'Generational wealth', 'Family financial planning', 'Money & relationships',
    'Behavioral finance', 'Money psychology', 'Options & derivatives', 'Life & health insurance',
  ],
  productivity: [
    'Time management', 'Time blocking', 'Calendar mastery', 'Time tracking', 'Pomodoro',
    'Deep work', 'Flow state', 'Distraction management', 'Energy management',
    'Note-taking systems', 'Zettelkasten', 'Building a Second Brain', 'Knowledge management',
    'Atomic habits', 'Saying no', 'Reading habits', 'Daily writing', 'Morning routines', 'Evening routines',
    'Getting Things Done (GTD)', 'Task prioritization', 'Eisenhower matrix', 'Email management', 'Inbox zero',
    'Daily review', 'Weekly review', 'Annual planning', 'Goal setting', 'OKRs (personal)', 'Decision journals',
    'Personal systems', 'Workflows & automation', 'Project management for individuals', 'Meeting effectiveness',
    'Digital minimalism',
  ],
  'family-relationships': [
    'Parenting', 'Authoritative parenting', 'Conscious parenting', 'Mindful parenting', 'Discipline & boundaries with kids',
    'Newborn & infant care', 'Toddler care', 'School-age kids', 'Teenage kids', 'Co-parenting',
    'Couple communication', 'Marriage', 'Conflict resolution', 'Love languages', 'Couples therapy basics', 'Money conversations with partner',
    'Family rituals', 'Family meetings', 'Quality time', 'Gratitude practice', 'Sibling relationships',
    'Education choices', 'Screen time',
    'Extended family / in-laws', 'Aging parents', 'Eldercare',
    'Adult friendships', 'Dating', 'Long-distance relationships',
    'Sexuality & intimacy', 'Fertility & pregnancy', 'Postpartum',
  ],
  learning: [
    'Spaced repetition', 'Anki', 'Memory palace',
    'Active reading', 'Reading techniques', 'Speed reading', 'Reading non-fiction', 'Reading fiction',
    'Languages', 'English fluency', 'Spanish',
    'Note-taking methods', 'Cornell notes', 'Sketchnotes', 'Knowledge review systems',
    'Feynman technique', 'First principles thinking', 'Cross-domain learning',
    'Skill acquisition', 'Deliberate practice', 'Self-directed learning', 'Online courses & MOOCs',
    'Research skills', 'Writing to learn', 'Teaching to learn', 'Public speaking practice',
    'Math fundamentals', 'Statistics',
    'Lifelong learning',
  ],
  'philosophy-culture': [
    'Stoicism', 'Marcus Aurelius', 'Seneca', 'Epictetus',
    'Eastern philosophy', 'Buddhism', 'Taoism',
    'Existentialism', 'Modern philosophy', 'Religion & spirituality',
    'Critical thinking', 'Logic & epistemology', 'Decision theory', 'Ethics',
    'World history', 'Ancient history', 'Modern history', 'Historical biographies',
    'Political philosophy', 'Economics', 'Game theory', 'Sociology', 'Anthropology', 'Geopolitics',
    'Literature classics', 'Art history', 'Music appreciation', 'Cinema & film', 'Aesthetics', 'Cultural studies',
    'News literacy', 'Polymath thinking',
  ],
  'hobbies-creativity': [
    'Writing', 'Blogging', 'Newsletters', 'Fiction writing',
    'Drawing', 'Painting', 'Watercolor', 'Calligraphy',
    'Photography', 'Phone photography',
    'Music — playing', 'Music theory', 'Guitar', 'Piano',
    'Cooking', 'Baking', 'Sourdough', 'BBQ & grilling', 'Knife skills', 'Wine', 'Specialty coffee',
    'Camping & backpacking', 'Hiking', 'Astronomy', 'Birdwatching',
    'Running (hobby)', 'Cycling (hobby)', 'Climbing', 'Tennis', 'Golf', 'Surfing',
    'Brazilian jiu-jitsu', 'Boxing', 'Yoga (practice)',
    'Chess', 'Board games',
    'Woodworking', 'DIY home improvement', 'Knitting & crochet',
    'Gardening', 'Houseplants',
    'Travel', 'Slow travel',
    'Reading (hobby)',
    'Cars', 'Motorcycles', 'Watches & horology', 'Mechanical keyboards',
  ],
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const INTEREST_TO_MACRO: Map<string, MacroSlug> = (() => {
  const m = new Map<string, MacroSlug>();
  for (const macroSlug of MACRO_SLUGS) {
    for (const interest of INTEREST_BY_MACRO[macroSlug]) {
      m.set(slugify(interest), macroSlug);
    }
  }
  return m;
})();

export function classifyMacro(
  llmMacro: string | null | undefined,
  topicSlugs: string[],
  userInterests: string[],
): MacroSlug {
  if (llmMacro && (MACRO_SLUGS as readonly string[]).includes(llmMacro)) {
    return llmMacro as MacroSlug;
  }
  const counts = new Map<MacroSlug, number>();
  for (const slug of topicSlugs) {
    const m = INTEREST_TO_MACRO.get(slug);
    if (m) counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  if (counts.size > 0) {
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }
  for (const i of userInterests) {
    const m = INTEREST_TO_MACRO.get(slugify(i));
    if (m) return m;
  }
  return 'tech';
}
