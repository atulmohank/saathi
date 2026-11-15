"use client";

import { useRouter } from "next/navigation";
import { post } from "./client-api";

export function SignOut({ label = "Sign out", className = "" }: { label?: string; className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={`btn-ghost ${className}`}
      onClick={async () => {
        await post("/api/auth/logout", {});
        router.push("/");
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}
