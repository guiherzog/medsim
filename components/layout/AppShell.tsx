import { cn } from "@/lib/utils";

/**
 * The mocks are designed as a mobile app: a single centred column capped at
 * 520px on the light app ground. Every screen renders inside this so widths
 * and horizontal padding stay identical across the flow.
 */
export function AppShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-col gap-5 px-6 pb-12 pt-4">
      <div className={cn("flex flex-col gap-5", className)}>{children}</div>
    </div>
  );
}
