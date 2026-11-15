"use client";

import { useEffect, useState } from "react";

export function ReadAloud({ text, lang, label, stopLabel, missingLabel }: { text: string; lang: string; label: string; stopLabel: string; missingLabel: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function speak() {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (!synth) {
      setMissing(true);
      return;
    }
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const prefix = lang.slice(0, 2);
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(prefix));
    if (!voice && prefix !== "en") {
      setMissing(true);
      return;
    }
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      if (voice) u.voice = voice;
      u.rate = 0.9;
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      setMissing(false);
      setSpeaking(true);
      synth.speak(u);
    } catch {
      setMissing(true);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" onClick={speak} className="btn-secondary min-h-14 text-[22px]" aria-pressed={speaking}>
        <span aria-hidden="true">🔊</span> {speaking ? stopLabel : label}
      </button>
      <p aria-live="polite" className="text-[20px] text-ink">
        {missing ? missingLabel : ""}
      </p>
    </div>
  );
}
