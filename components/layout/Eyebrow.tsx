import { cn } from "@/lib/utils";

/**
 * The small uppercase mono label the mocks use above headings
 * ("ÍNDICE DE PRONTIDÃO", "SUA MAIOR LACUNA").
 */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("font-mono text-[11px] uppercase tracking-[0.09em]", className)}>
      {children}
    </span>
  );
}
