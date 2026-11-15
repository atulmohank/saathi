/**
 * Colourful, soft "3D" duotone icons for the trust strip: layered gradients, a top highlight
 * and a contact shadow. Decorative (the card text says the same thing).
 */
type P = { className?: string };

const Shell = ({ id, from, to, children, className }: { id: string; from: string; to: string; children: React.ReactNode; className?: string }) => (
  <svg viewBox="0 0 72 72" width="72" height="72" aria-hidden="true" focusable="false" className={className}>
    <defs>
      <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={from} />
        <stop offset="1" stopColor={to} />
      </linearGradient>
      <linearGradient id={`${id}-hi`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".7" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
    <ellipse cx="36" cy="66" rx="20" ry="3.5" fill="#163F33" opacity=".12" />
    <rect x="6" y="4" width="60" height="58" rx="20" fill={`url(#${id}-bg)`} />
    <path d="M14 10h44a12 12 0 0 1 8 3v6c-14-6-46-6-60 0v-6a12 12 0 0 1 8-3z" fill={`url(#${id}-hi)`} />
    {children}
  </svg>
);

export const IconLock = ({ className }: P) => (
  <Shell id="ic-lock" from="#F9D9A0" to="#E8A33D" className={className}>
    <path d="M27 31v-5a9 9 0 0 1 18 0v5" fill="none" stroke="#8A5A12" strokeWidth="4" strokeLinecap="round" />
    <rect x="22" y="30" width="28" height="22" rx="7" fill="#FFFDF9" />
    <rect x="22" y="30" width="28" height="7" rx="3.5" fill="#fff" />
    <circle cx="36" cy="41" r="3.2" fill="#1F5C4A" />
    <path d="M36 43v4" stroke="#1F5C4A" strokeWidth="3" strokeLinecap="round" />
  </Shell>
);

export const IconBell = ({ className }: P) => (
  <Shell id="ic-bell" from="#CFE3D6" to="#5E9B7C" className={className}>
    <path d="M36 18a11 11 0 0 1 11 11v7l4 6H21l4-6v-7a11 11 0 0 1 11-11z" fill="#FFFDF9" />
    <path d="M30 46a6 6 0 0 0 12 0z" fill="#1F5C4A" />
    <circle cx="48" cy="20" r="6" fill="#E8A33D" stroke="#FFFDF9" strokeWidth="2.5" />
  </Shell>
);

export const IconHandHeart = ({ className }: P) => (
  <Shell id="ic-hand" from="#F8D2C2" to="#D9875A" className={className}>
    <path d="M36 34c-7-5-12-9-12-14a5.5 5.5 0 0 1 12-2 5.5 5.5 0 0 1 12 2c0 5-5 9-12 14z" fill="#B3261E" opacity=".9" />
    <path d="M14 46c6-1 10 0 14 3h10a3.5 3.5 0 0 1 0 7H29m9 0h9l9-7a3.5 3.5 0 0 1 5 5l-10 9H24l-10-3z" fill="#FFFDF9" stroke="#FFFDF9" strokeWidth="1.5" strokeLinejoin="round" />
  </Shell>
);

export const IconLanguages = ({ className }: P) => (
  <Shell id="ic-lang" from="#D5DCF2" to="#6B7FBF" className={className}>
    <rect x="13" y="17" width="30" height="22" rx="9" fill="#FFFDF9" />
    <path d="M20 39l-3 7 9-7z" fill="#FFFDF9" />
    <text x="28" y="33" textAnchor="middle" fontSize="13" fontWeight="700" fill="#2B3A67" fontFamily="var(--font-deva), sans-serif">अ</text>
    <rect x="31" y="31" width="28" height="20" rx="8" fill="#E8A33D" />
    <path d="M52 51l3 6-8-6z" fill="#E8A33D" />
    <text x="45" y="45.5" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1F2A24" fontFamily="var(--font-tamil), sans-serif">த</text>
  </Shell>
);
