// PROTOTYPE tooling — throwaway alongside components/case-runner/prototype.
"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Floating variant switcher for UI prototypes. Deliberately high-contrast so
 * it's obviously not part of the design being judged. Rendered only where the
 * host page decides (non-production), never shipped to real users.
 */
export function PrototypeSwitcher({
  variants,
  current,
  names,
}: {
  variants: string[];
  current: string;
  names?: Record<string, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const index = Math.max(0, variants.indexOf(current));

  function go(delta: number) {
    const next = variants[(index + delta + variants.length) % variants.length];
    const params = new URLSearchParams(searchParams.toString());
    params.set("variant", next);
    router.replace(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#111827] px-1.5 py-1.5 text-white shadow-lg ring-1 ring-white/20">
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Variante anterior"
        className="rounded-full p-1.5 hover:bg-white/15"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="px-2 font-mono text-[11px] whitespace-nowrap">
        PROTÓTIPO {current}
        {names?.[current] ? ` — ${names[current]}` : ""}
      </span>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Próxima variante"
        className="rounded-full p-1.5 hover:bg-white/15"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
