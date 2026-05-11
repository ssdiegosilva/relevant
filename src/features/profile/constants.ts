export type SubGroup = {
  name: string;
  interests: string[];
};

export type MacroCategory = {
  id: string;
  name: string;
  icon: string;
  groups: SubGroup[];
};

export const MACRO_CATEGORIES: MacroCategory[] = [
  {
    id: 'tech',
    name: 'Technology',
    icon: 'laptop',
    groups: [
      {
        name: 'Frontend',
        interests: [
          'React',
          'Next.js',
          'Vue',
          'Svelte',
          'Angular',
          'TypeScript',
          'CSS / Design systems',
          'Web performance',
          'Accessibility',
        ],
      },
      {
        name: 'Backend',
        interests: ['Node.js', 'Python', 'Go', 'Rust', 'Java / Kotlin', 'Ruby'],
      },
      {
        name: 'Mobile',
        interests: ['iOS / Swift', 'Android / Kotlin', 'React Native', 'Flutter'],
      },
      {
        name: 'Databases',
        interests: ['PostgreSQL', 'MongoDB', 'Redis', 'ClickHouse', 'MySQL', 'SQLite'],
      },
      {
        name: 'Cloud & Infra',
        interests: ['AWS', 'GCP', 'Azure', 'Cloudflare', 'Docker', 'Kubernetes', 'Terraform'],
      },
      {
        name: 'AI & ML',
        interests: [
          'LLMs / AI',
          'Prompt engineering',
          'RAG / Vector DBs',
          'Machine learning',
          'Fine-tuning',
        ],
      },
      {
        name: 'Architecture',
        interests: [
          'System design',
          'Microservices',
          'Event-driven',
          'REST APIs',
          'GraphQL',
          'DDD',
          'Clean architecture',
          'Functional programming',
        ],
      },
      {
        name: 'Quality & Security',
        interests: [
          'Testing & TDD',
          'Observability',
          'Security',
          'OAuth / OWASP',
          'Performance',
          'Caching',
        ],
      },
      {
        name: 'DevOps',
        interests: ['CI/CD', 'DevOps / SRE', 'Git', 'Linux / Bash'],
      },
    ],
  },
  {
    id: 'health',
    name: 'Health',
    icon: 'heart-pulse',
    groups: [
      {
        name: 'Nutrition',
        interests: [
          'Nutrition basics',
          'Macros & calories',
          'Micronutrients',
          'Hydration & electrolytes',
          'Intermittent fasting',
        ],
      },
      {
        name: 'Sleep',
        interests: ['Sleep quality', 'Sleep hygiene', 'Circadian rhythm', 'Recovery & sleep tracking'],
      },
      {
        name: 'Strength',
        interests: ['Strength training', 'Hypertrophy', 'Calisthenics', 'Powerlifting'],
      },
      {
        name: 'Cardio',
        interests: ['Cardio', 'Zone 2 training', 'HIIT', 'Running', 'Cycling', 'Swimming'],
      },
      {
        name: 'Mobility',
        interests: ['Mobility', 'Flexibility', 'Yoga', 'Pilates'],
      },
      {
        name: 'Longevity',
        interests: [
          'Longevity',
          'Healthspan',
          'Cognitive health',
          'Cardiovascular health',
          'Bone & joint health',
        ],
      },
      {
        name: 'Hormones & Metabolism',
        interests: ['Hormonal health', 'Metabolic health', 'Insulin sensitivity'],
      },
      {
        name: 'Mind-body',
        interests: ['Stress management', 'Cold exposure', 'Sauna / heat'],
      },
      {
        name: 'Gut',
        interests: ['Gut health', 'Microbiome', 'Immune system'],
      },
      {
        name: 'Other',
        interests: ['Supplements', 'Skin health', 'Bloodwork interpretation'],
      },
    ],
  },
  {
    id: 'psychology',
    name: 'Psychology',
    icon: 'brain',
    groups: [
      {
        name: 'Habits & Motivation',
        interests: [
          'Habits & habit formation',
          'Motivation & discipline',
          'Willpower',
          'Procrastination',
        ],
      },
      {
        name: 'Emotional',
        interests: [
          'Emotional intelligence',
          'Self-regulation',
          'Self-awareness',
          'Self-compassion',
          'Resilience',
        ],
      },
      {
        name: 'Cognition',
        interests: [
          'Cognitive biases',
          'Mental models',
          'First principles',
          'Decision making',
          'Memory & cognition',
        ],
      },
      {
        name: 'Relationships',
        interests: [
          'Attachment styles',
          'Communication',
          'Active listening',
          'Nonviolent Communication',
          'Difficult conversations',
          'Boundaries',
        ],
      },
      {
        name: 'Mental Health',
        interests: [
          'Anxiety',
          'Depression awareness',
          'Therapy basics',
          'CBT fundamentals',
          'Trauma awareness',
          'Burnout prevention',
        ],
      },
      {
        name: 'Mind Practices',
        interests: ['Mindfulness', 'Meditation', 'Breathwork', 'Focus & attention', 'ADHD strategies'],
      },
      {
        name: 'Identity',
        interests: ['Identity & values', 'Shadow work', 'Imposter syndrome', 'Perfectionism'],
      },
      {
        name: 'Connection',
        interests: ['Loneliness & connection', 'Grief & loss'],
      },
    ],
  },
  {
    id: 'career',
    name: 'Career',
    icon: 'briefcase-outline',
    groups: [
      {
        name: 'Leadership',
        interests: [
          'Leadership',
          'People management',
          '1:1 conversations',
          'Engineering management',
          'Tech leadership',
          'Mentorship',
        ],
      },
      {
        name: 'Communication',
        interests: [
          'Negotiation',
          'Salary negotiation',
          'Giving feedback',
          'Receiving feedback',
          'Public speaking',
          'Conference talks',
        ],
      },
      {
        name: 'Growth',
        interests: [
          'Career growth',
          'Career ladders',
          'Career transitions',
          'Performance reviews',
          'Promotions',
        ],
      },
      {
        name: 'Brand & Network',
        interests: ['Personal branding', 'LinkedIn presence', 'Networking', 'Writing for work'],
      },
      {
        name: 'Hiring',
        interests: ['Hiring & interviewing'],
      },
      {
        name: 'Product',
        interests: ['Product management', 'Strategy & OKRs', 'Customer development'],
      },
      {
        name: 'Entrepreneurship',
        interests: [
          'Founder skills',
          'Entrepreneurship',
          'Bootstrapping',
          'Building a SaaS',
        ],
      },
      {
        name: 'Workstyle',
        interests: ['Remote / async work', 'Side projects', 'Freelancing', 'Consulting'],
      },
      {
        name: 'Influence',
        interests: ['Office politics', 'Influence & persuasion'],
      },
      {
        name: 'Sales & Marketing',
        interests: ['Sales fundamentals', 'Marketing fundamentals'],
      },
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: 'cash-multiple',
    groups: [
      {
        name: 'Investing',
        interests: [
          'Investing basics',
          'Index funds',
          'ETFs',
          'Stock market',
          'Fundamental analysis',
          'Bonds & fixed income',
          'Asset allocation',
          'Portfolio rebalancing',
        ],
      },
      {
        name: 'Real Estate',
        interests: ['Real estate investing', 'REITs', 'Mortgage', 'Buying a home'],
      },
      {
        name: 'Retirement & Estate',
        interests: ['Retirement planning', '401k / IRA', 'Estate planning', 'Wills & trusts'],
      },
      {
        name: 'Tax',
        interests: ['Tax planning', 'Tax optimization'],
      },
      {
        name: 'Personal Finance',
        interests: [
          'Budgeting',
          'Cash flow management',
          'Net worth tracking',
          'Emergency fund',
          'Saving rate',
          'Debt management',
        ],
      },
      {
        name: 'FIRE',
        interests: ['Financial independence (FIRE)', 'Side income', 'Passive income'],
      },
      {
        name: 'Crypto',
        interests: ['Crypto fundamentals', 'Bitcoin', 'Ethereum / DeFi'],
      },
      {
        name: 'Macro',
        interests: ['Inflation & macro', 'Interest rates'],
      },
      {
        name: 'Family Finance',
        interests: [
          'Generational wealth',
          'Family financial planning',
          'Money & relationships',
        ],
      },
      {
        name: 'Mindset & Advanced',
        interests: [
          'Behavioral finance',
          'Money psychology',
          'Options & derivatives',
          'Life & health insurance',
        ],
      },
    ],
  },
  {
    id: 'productivity',
    name: 'Productivity',
    icon: 'clock-check-outline',
    groups: [
      {
        name: 'Time',
        interests: ['Time management', 'Time blocking', 'Calendar mastery', 'Time tracking', 'Pomodoro'],
      },
      {
        name: 'Deep Work',
        interests: ['Deep work', 'Flow state', 'Distraction management', 'Energy management'],
      },
      {
        name: 'Notes',
        interests: [
          'Note-taking systems',
          'Zettelkasten',
          'Building a Second Brain',
          'Knowledge management',
        ],
      },
      {
        name: 'Habits',
        interests: [
          'Atomic habits',
          'Saying no',
          'Reading habits',
          'Daily writing',
          'Morning routines',
          'Evening routines',
        ],
      },
      {
        name: 'Tasks',
        interests: [
          'Getting Things Done (GTD)',
          'Task prioritization',
          'Eisenhower matrix',
          'Email management',
          'Inbox zero',
        ],
      },
      {
        name: 'Reviews & Planning',
        interests: [
          'Daily review',
          'Weekly review',
          'Annual planning',
          'Goal setting',
          'OKRs (personal)',
          'Decision journals',
        ],
      },
      {
        name: 'Systems',
        interests: [
          'Personal systems',
          'Workflows & automation',
          'Project management for individuals',
          'Meeting effectiveness',
        ],
      },
      {
        name: 'Digital Life',
        interests: ['Digital minimalism'],
      },
    ],
  },
  {
    id: 'family',
    name: 'Family & Relationships',
    icon: 'account-group-outline',
    groups: [
      {
        name: 'Parenting Style',
        interests: [
          'Parenting',
          'Authoritative parenting',
          'Conscious parenting',
          'Mindful parenting',
          'Discipline & boundaries with kids',
        ],
      },
      {
        name: 'Stages',
        interests: [
          'Newborn & infant care',
          'Toddler care',
          'School-age kids',
          'Teenage kids',
          'Co-parenting',
        ],
      },
      {
        name: 'Couple',
        interests: [
          'Couple communication',
          'Marriage',
          'Conflict resolution',
          'Love languages',
          'Couples therapy basics',
          'Money conversations with partner',
        ],
      },
      {
        name: 'Family Life',
        interests: [
          'Family rituals',
          'Family meetings',
          'Quality time',
          'Gratitude practice',
          'Sibling relationships',
        ],
      },
      {
        name: 'Education',
        interests: ['Education choices', 'Screen time'],
      },
      {
        name: 'Wider Family',
        interests: ['Extended family / in-laws', 'Aging parents', 'Eldercare'],
      },
      {
        name: 'Adult Connections',
        interests: ['Adult friendships', 'Dating', 'Long-distance relationships'],
      },
      {
        name: 'Intimacy',
        interests: ['Sexuality & intimacy', 'Fertility & pregnancy', 'Postpartum'],
      },
    ],
  },
  {
    id: 'learning',
    name: 'Learning',
    icon: 'school-outline',
    groups: [
      {
        name: 'Memory',
        interests: ['Spaced repetition', 'Anki', 'Memory palace'],
      },
      {
        name: 'Reading',
        interests: [
          'Active reading',
          'Reading techniques',
          'Speed reading',
          'Reading non-fiction',
          'Reading fiction',
        ],
      },
      {
        name: 'Languages',
        interests: ['Languages', 'English fluency', 'Spanish'],
      },
      {
        name: 'Notes',
        interests: ['Note-taking methods', 'Cornell notes', 'Sketchnotes', 'Knowledge review systems'],
      },
      {
        name: 'Frameworks',
        interests: [
          'Feynman technique',
          'Mental models',
          'First principles thinking',
          'Cross-domain learning',
        ],
      },
      {
        name: 'Skill Development',
        interests: [
          'Skill acquisition',
          'Deliberate practice',
          'Self-directed learning',
          'Online courses & MOOCs',
        ],
      },
      {
        name: 'Research & Output',
        interests: [
          'Research skills',
          'Writing to learn',
          'Teaching to learn',
          'Public speaking practice',
        ],
      },
      {
        name: 'Subjects',
        interests: ['Math fundamentals', 'Statistics'],
      },
      {
        name: 'Mindset',
        interests: ['Lifelong learning'],
      },
    ],
  },
  {
    id: 'philosophy',
    name: 'Philosophy & Culture',
    icon: 'book-open-variant',
    groups: [
      {
        name: 'Stoicism',
        interests: ['Stoicism', 'Marcus Aurelius', 'Seneca', 'Epictetus'],
      },
      {
        name: 'Eastern',
        interests: ['Eastern philosophy', 'Buddhism', 'Taoism'],
      },
      {
        name: 'Western Tradition',
        interests: ['Existentialism', 'Modern philosophy', 'Religion & spirituality'],
      },
      {
        name: 'Critical Thinking',
        interests: ['Critical thinking', 'Logic & epistemology', 'Decision theory', 'Ethics'],
      },
      {
        name: 'History',
        interests: ['World history', 'Ancient history', 'Modern history', 'Historical biographies'],
      },
      {
        name: 'Society',
        interests: [
          'Political philosophy',
          'Economics',
          'Game theory',
          'Sociology',
          'Anthropology',
          'Geopolitics',
        ],
      },
      {
        name: 'Arts',
        interests: [
          'Literature classics',
          'Art history',
          'Music appreciation',
          'Cinema & film',
          'Aesthetics',
          'Cultural studies',
        ],
      },
      {
        name: 'Information',
        interests: ['News literacy', 'Polymath thinking'],
      },
    ],
  },
  {
    id: 'hobbies',
    name: 'Hobbies & Creativity',
    icon: 'palette-outline',
    groups: [
      {
        name: 'Writing',
        interests: ['Writing', 'Blogging', 'Newsletters', 'Fiction writing'],
      },
      {
        name: 'Visual Arts',
        interests: ['Drawing', 'Painting', 'Watercolor', 'Calligraphy'],
      },
      {
        name: 'Photography',
        interests: ['Photography', 'Phone photography'],
      },
      {
        name: 'Music',
        interests: ['Music — playing', 'Music theory', 'Guitar', 'Piano'],
      },
      {
        name: 'Cooking & Drinks',
        interests: [
          'Cooking',
          'Baking',
          'Sourdough',
          'BBQ & grilling',
          'Knife skills',
          'Wine',
          'Specialty coffee',
        ],
      },
      {
        name: 'Outdoors',
        interests: ['Camping & backpacking', 'Hiking', 'Astronomy', 'Birdwatching'],
      },
      {
        name: 'Sports',
        interests: [
          'Running (hobby)',
          'Cycling (hobby)',
          'Climbing',
          'Tennis',
          'Golf',
          'Surfing',
          'Brazilian jiu-jitsu',
          'Boxing',
          'Yoga (practice)',
        ],
      },
      {
        name: 'Games',
        interests: ['Chess', 'Board games'],
      },
      {
        name: 'Crafts',
        interests: ['Woodworking', 'DIY home improvement', 'Knitting & crochet'],
      },
      {
        name: 'Garden',
        interests: ['Gardening', 'Houseplants'],
      },
      {
        name: 'Travel',
        interests: ['Travel', 'Slow travel'],
      },
      {
        name: 'Reading',
        interests: ['Reading (hobby)'],
      },
      {
        name: 'Gear',
        interests: ['Cars', 'Motorcycles', 'Watches & horology', 'Mechanical keyboards'],
      },
    ],
  },
];

export const INTERESTS_OPTIONS = MACRO_CATEGORIES.flatMap((c) =>
  c.groups.flatMap((g) => g.interests),
);

export const INTEREST_LOOKUP = new Set(
  INTERESTS_OPTIONS.map((i) => i.toLowerCase()),
);

export const MAX_INTERESTS = 10;

export function macroAllInterests(cat: MacroCategory): string[] {
  return cat.groups.flatMap((g) => g.interests);
}
