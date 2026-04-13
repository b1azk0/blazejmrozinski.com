import routes from './routes.json';

export type Locale = 'en' | 'pl';

export const LOCALES: Locale[] = ['en', 'pl'];

export function isLocale(value: string): value is Locale {
  return value === 'en' || value === 'pl';
}

export function localePrefix(locale: Locale): string {
  return locale === 'en' ? '' : '/pl';
}

export function localizedHref(key: keyof typeof routes.en, locale: Locale): string {
  const slug = routes[locale][key];
  return `${localePrefix(locale)}/${slug}`;
}
