/* eslint-disable @next/next/no-img-element -- small static photo inside an illustration */
import { Pill } from "../Pill";

/**
 * A CSS phone showing the real elder "Today" card (same layout and tokens as the app).
 * It is an illustration of the product: one accessible name, inner content hidden.
 */
export function PhoneMock({ className = "" }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Saathi on Kamala's phone: her next medicine is Amlodipine 5 mg at 8:00 AM, with a big “I took it” button."
      className={`relative rounded-[44px] bg-[#1F2A24] p-[10px] shadow-[0_2px_4px_rgb(22_63_51/.1),0_40px_80px_-30px_rgb(22_63_51/.55)] ${className}`}
    >
      <div aria-hidden="true" className="relative overflow-hidden rounded-[36px] bg-[linear-gradient(180deg,#F9DFC8_0%,#FBF0E3_38%,#FBF7F0_100%)]">
        <div className="absolute left-1/2 top-2 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-[#1F2A24]" />
        <div className="px-4 pb-5 pt-10">
          <div className="flex items-center gap-2.5">
            <img src="/images/kamala-avatar.webp" alt="" width={36} height={36} className="size-9 rounded-full object-cover ring-2 ring-white" />
            <div className="leading-tight">
              <p className="font-serif text-[15px] font-semibold text-ink">Namaste, Kamala</p>
              <p className="text-[10px] text-ink-soft">Sunday, 15 November · Morning</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-ink-soft">
            <span className="size-2 rounded-full bg-success" />
            <span className="size-2 rounded-full bg-[#D6CFC3]" />
            <span className="size-2 rounded-full bg-[#D6CFC3]" />
            <span className="ml-1">1 of 3 taken today</span>
          </div>
          <div className="mt-3 rounded-[22px] bg-white/85 p-4 shadow-[0_18px_36px_-22px_rgb(22_63_51/.5)] backdrop-blur">
            <p className="text-[10px] font-semibold text-ink-soft">Your next medicine</p>
            <div className="mt-2 flex items-center gap-3">
              <Pill look="pink round" size={34} />
              <div>
                <p className="font-serif text-[22px] font-semibold leading-none text-ink">Amlodipine</p>
                <p className="mt-1 text-[11px] text-ink-soft">5 mg, 1 tablet</p>
              </div>
            </div>
            <p className="mt-2 text-[13px] font-semibold text-primary">at 8:00 AM</p>
            <div className="mt-3 rounded-full bg-primary py-2.5 text-center text-[13px] font-semibold text-white">✓ I took it</div>
            <div className="mt-2 rounded-full border-[1.5px] border-primary py-2 text-center text-[12px] font-semibold text-primary">Not now</div>
          </div>
          <div className="mt-3 flex justify-center gap-1.5 text-[9px] font-semibold text-ink-soft">
            {["English", "हिन्दी", "தமிழ்"].map((l) => (
              <span key={l} className="rounded-full bg-white/70 px-2 py-1">
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
