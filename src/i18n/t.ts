import en from './en.json';
import pl from './pl.json';
import type { Locale } from './locale';

const dictionaries = { en, pl } as const;

export function t(key: string, locale: Locale = 'en'): string {
  const parts = key.split('.');

  function lookup(dict: unknown): string | undefined {
    let value: unknown = dict;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return typeof value === 'string' ? value : undefined;
  }

  const direct = lookup(dictionaries[locale]);
  if (direct !== undefined && direct !== '') return direct;

  if (locale !== 'en') {
    const fallback = lookup(dictionaries.en);
    if (fallback !== undefined && fallback !== '') return fallback;
  }

  return key;
}
