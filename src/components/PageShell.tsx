import { Lockup } from "./Lockup";
import { Thread } from "./landing/Thread";

/**
 * Warm frame for secondary pages (sign-in, create, emergency card, audit, Doctor Brief, email links):
 * peach-to-cream ground, one soft blob, the saffron thread, and the lockup. Children bring their own <main>.
 */
export function PageShell({ children, tone = "peach" }: { children: React.ReactNode; tone?: "peach" | "sage" }) {
  const ground =
    tone === "sage"
      ? "bg-[linear-gradient(180deg,#FBF7F0_0%,#E7EFE9_100%)]"
      : "bg-[linear-gradient(180deg,#FBF7F0_0%,#F9EDE2_45%,#F6E3D3_100%)]";
  return (
    <div className={`relative isolate flex flex-1 flex-col overflow-hidden ${ground} print:bg-white`}>
      <div aria-hidden="true" className="no-print pointer-events-none absolute inset-0 -z-10">
        <div className="blob -right-32 -top-24 size-[30rem] bg-peach opacity-80" />
        <div className="blob -bottom-40 -left-32 size-[26rem] bg-sage opacity-90" />
        <Thread variant="wave" className="absolute inset-x-0 top-20 h-24 w-full opacity-60" />
      </div>
      <header className="wrap flex items-center justify-between py-5">
        <Lockup href="/" />
      </header>
      {children}
    </div>
  );
}
