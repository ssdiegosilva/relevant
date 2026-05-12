export type CardType = 'concept' | 'example' | 'best_practice' | 'pitfall' | 'news';

export type Card = {
  id: string;
  user_id: string;
  session_id: string;
  challenge_id: string;
  title: string;
  content: string;
  card_type: CardType;
  difficulty: number;
  estimated_minutes: number;
  source: string;
  content_hash: string;
  suggestions: string[] | null;
  created_at: string;
};

export type CardDeepening = {
  id: string;
  card_id: string;
  prompt: string;
  content: string;
  suggestions: string[] | null;
  created_at: string;
};

export type CardAction = 'viewed' | 'studied' | 'saved' | 'skipped' | 'deepened' | 'rated';

export type GenerateCardsResponse = {
  session_id: string;
  cards: Card[];
};
