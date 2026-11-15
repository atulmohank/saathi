import en from "./en.json";
import hi from "./hi.json";

export const DICTS = { en, hi } as const;
export type UiLang = keyof typeof DICTS;
export type Key = keyof typeof en;

export const LANG_LABELS: Record<UiLang, string> = { en: "English", hi: "हिन्दी" };
export const SPEECH_LANG: Record<UiLang, string> = { en: "en-IN", hi: "hi-IN" };

export function pickLang(v: string | undefined | null, fallback: string): UiLang {
  if (v && v in DICTS) return v as UiLang;
  return fallback in DICTS ? (fallback as UiLang) : "en";
}

export function t(lang: UiLang, key: Key, vars: Record<string, string | number> = {}): string {
  const s: string = (DICTS[lang] as Record<string, string>)[key] ?? en[key];
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
