import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createElement } from 'react';

import { strings, type StringKey } from './strings';

export type Lang = 'en' | 'pt';

const STORAGE_KEY = 'app.language';

type I18nContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (k) => strings.en[k] ?? k,
});

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'pt' || stored === 'en') {
        setLangState(stored);
      } else {
        const device = Localization.getLocales()[0]?.languageCode;
        setLangState(device === 'pt' ? 'pt' : 'en');
      }
    });
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
  };

  const t = (key: StringKey, vars?: Record<string, string | number>) => {
    const tpl = strings[lang][key] ?? strings.en[key] ?? key;
    return interpolate(tpl, vars);
  };

  return createElement(I18nContext.Provider, { value: { lang, setLang, t } }, children);
}

export const useI18n = () => useContext(I18nContext);
