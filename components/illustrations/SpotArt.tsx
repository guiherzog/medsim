import { cn } from "@/lib/utils";

/**
 * Duotone spot illustrations for the moments that were otherwise bare: an empty
 * case list, and the two debrief outcomes. Inline SVG, brand palette, sized by
 * the caller.
 */

/** Stacked case cards with a flat trace — nothing to run yet. */
export function EmptyCasesArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 104" className={cn("w-full", className)} role="img" aria-hidden>
      <rect x="26" y="18" width="88" height="62" rx="12" fill="#4aa3ff" opacity=".18" />
      <rect x="18" y="28" width="88" height="62" rx="12" fill="#0d1f45" opacity=".08" />
      <rect x="22" y="32" width="80" height="54" rx="10" fill="#ffffff" />
      <rect x="32" y="44" width="34" height="6" rx="3" fill="#4aa3ff" opacity=".45" />
      <rect x="32" y="56" width="52" height="5" rx="2.5" fill="#0d1f45" opacity=".14" />
      <path
        d="M32 72h14l3-6 4 11 3-5h11"
        stroke="#38e2c5"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** Steady rhythm inside a shield — the patient held. */
export function StabilisedArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 104" className={cn("w-full", className)} role="img" aria-hidden>
      <path
        d="M60 10l30 10v30c0 22-13 36-30 44-17-8-30-22-30-44V20l30-10Z"
        fill="#38e2c5"
        opacity=".22"
      />
      <path
        d="M60 20l20 6.7v22.6c0 15.5-8.7 25.4-20 31.4-11.3-6-20-15.9-20-31.4V26.7L60 20Z"
        fill="#38e2c5"
      />
      <path
        d="M40 52h8l4-9 6 18 4-9h18"
        stroke="#06121f"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** A flatline breaking out of the circle — the patient lost ground. */
export function CompromisedArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 104" className={cn("w-full", className)} role="img" aria-hidden>
      <circle cx="60" cy="52" r="40" fill="#ff6b6b" opacity=".18" />
      <circle cx="60" cy="52" r="27" fill="#ff6b6b" />
      <path
        d="M22 52h26l5-11 6 22 4-11h35"
        stroke="#06121f"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity=".55"
      />
      <path
        d="M22 52h76"
        stroke="#2a0a10"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="6 8"
      />
    </svg>
  );
}
