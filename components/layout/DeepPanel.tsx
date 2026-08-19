import { cn } from "@/lib/utils";

/**
 * The deep navy display surface from the mocks — a navy gradient with a mint
 * glow in the top-right corner, used for hero and score panels.
 */
export function DeepPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl p-7 text-deep-foreground",
        "bg-[radial-gradient(400px_300px_at_80%_0%,rgba(56,226,197,0.42)_0%,transparent_60%),linear-gradient(150deg,#0d1f45,#171a54)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
