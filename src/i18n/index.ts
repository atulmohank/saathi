import en from "./en.json";
import hi from "./hi.json";
import ta from "./ta.json";
import te from "./te.json";
import kn from "./kn.json";
import ml from "./ml.json";

/** Elder-view strings. EN is the source; HI, TA, TE, KN, ML are AI-assisted translations. */
export const DICTS = { en, hi, ta, te, kn, ml } as const;
export type UiLang = keyof typeof DICTS;
export type Key = keyof typeof en;

export const LANG_LABELS: Record<UiLang, string> = { en: "English", hi: "हिन्दी", ta: "தமிழ்", te: "తెలుగు", kn: "ಕನ್ನಡ", ml: "മലയാളം" };
export const SPEECH_LANG: Record<UiLang, string> = { en: "en-IN", hi: "hi-IN", ta: "ta-IN", te: "te-IN", kn: "kn-IN", ml: "ml-IN" };

export function pickLang(v: string | undefined | null, fallback: string): UiLang {
  if (v && v in DICTS) return v as UiLang;
  return fallback in DICTS ? (fallback as UiLang) : "en";
}

export function t(lang: UiLang, key: Key, vars: Record<string, string | number> = {}): string {
  const s: string = (DICTS[lang] as Record<string, string>)[key] ?? en[key];
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
