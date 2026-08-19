import { cn } from "@/lib/utils";

/**
 * Duotone specialty marks — a filled body shape plus one accent detail, drawn on
 * the brand palette. Inline SVG rather than image assets: the app ships no
 * binaries, and these have to recolour with the theme.
 *
 * Matching is on a normalised substring so a new case category doesn't render
 * blank — anything unrecognised falls back to the generic mark.
 */
type Mark = { tint: string; art: React.ReactNode };

const HEART =
  "M24 41C24 41 7 29.5 7 18.8 7 13.4 11.3 9 16.6 9 19.9 9 22.6 10.7 24 13.2 25.4 10.7 28.1 9 31.4 9 36.7 9 41 13.4 41 18.8 41 29.5 24 41 24 41Z";

const MARKS: { match: string[]; mark: Mark }[] = [
  {
    // Cardiologia — heart with an ECG trace cut across it.
    match: ["cardio"],
    mark: {
      tint: "bg-sky/12",
      art: (
        <>
          <path d={HEART} fill="#4aa3ff" />
          <path
            d="M13 24.5h5l2.8-6 4 12 2.8-6h7.4"
            stroke="#38e2c5"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      ),
    },
  },
  {
    // Alergia — airway with a swollen, constricted segment.
    match: ["alerg"],
    mark: {
      tint: "bg-violet/12",
      art: (
        <>
          <path
            d="M15 8h18a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-3.2a2 2 0 0 0-2 2v2.4a2 2 0 0 0 .6 1.4l3 3a6 6 0 0 1 1.8 4.3V38a2 2 0 0 1-2 2H14.8a2 2 0 0 1-2-2v-10.5a6 6 0 0 1 1.8-4.3l3-3a2 2 0 0 0 .6-1.4V16a2 2 0 0 0-2-2H15a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Z"
            fill="#8b7bff"
          />
          <rect x="16" y="18.5" width="16" height="6" rx="3" fill="#ff9d6b" />
        </>
      ),
    },
  },
  {
    // Emergência/UTI — infusion bag with fluid and a falling drop.
    match: ["uti", "intensiv", "emerg"],
    mark: {
      tint: "bg-mint/12",
      art: (
        <>
          <path d="M15 6h18v20a9 9 0 0 1-18 0Z" fill="#4aa3ff" />
          <path d="M15 18h18v8a9 9 0 0 1-18 0Z" fill="#38e2c5" />
          <rect x="22.5" y="34" width="3" height="5" rx="1.5" fill="#0d1f45" opacity=".45" />
          <path d="M24 40.5c1.7 0 3-1.2 3-2.7 0-1.6-3-4.3-3-4.3s-3 2.7-3 4.3c0 1.5 1.3 2.7 3 2.7Z" fill="#38e2c5" />
        </>
      ),
    },
  },
];

const FALLBACK: Mark = {
  tint: "bg-secondary",
  art: (
    <>
      <circle cx="24" cy="24" r="17" fill="#4aa3ff" />
      <path
        d="M24 15v18M15 24h18"
        stroke="#eaf1fb"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
};

function normalise(category: string) {
  return category
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function markFor(category: string): Mark {
  const key = normalise(category);
  // Ordered: "Alergia/Emergência" also contains "emerg", so alergia must win.
  return MARKS.find((m) => m.match.some((needle) => key.includes(needle)))?.mark ?? FALLBACK;
}

export function SpecialtyMark({
  category,
  className,
  size = "md",
}: {
  category: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const mark = markFor(category);
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl",
        mark.tint,
        size === "sm" ? "size-10" : "size-12",
        className,
      )}
    >
      <svg
        viewBox="0 0 48 48"
        className={size === "sm" ? "size-7" : "size-8"}
        role="img"
        aria-hidden
      >
        {mark.art}
      </svg>
    </span>
  );
}
