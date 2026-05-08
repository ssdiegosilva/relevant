import { create } from 'zustand';

export type OnboardingDraft = {
  role: string;
  experienceYears: number;
  interests: string[];
  goal: string;
  preferredStudyTime: string;
};

const empty: OnboardingDraft = {
  role: '',
  experienceYears: 3,
  interests: [],
  goal: '',
  preferredStudyTime: '20:00',
};

export const useOnboardingStore = create<{
  draft: OnboardingDraft;
  set: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void;
  reset: () => void;
}>((set) => ({
  draft: empty,
  set: (key, value) => set((s) => ({ draft: { ...s.draft, [key]: value } })),
  reset: () => set({ draft: empty }),
}));
