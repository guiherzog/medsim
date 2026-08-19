import { cn } from "@/lib/utils";

const TONES = {
  brand: "bg-gradient-to-br from-mint via-sky to-violet text-[#06121f]",
  mint: "bg-mint/15 text-[#0d9488]",
  sky: "bg-sky/15 text-[#2b6fc4]",
  violet: "bg-violet/15 text-[#6d5ef0]",
  danger: "bg-destructive/12 text-destructive",
} as const;

const SIZES = {
  sm: "size-[30px] rounded-[9px] [&_svg]:size-4",
  lg: "size-11 rounded-[13px] [&_svg]:size-6",
} as const;

/**
 * The rounded tinted square holding an icon, used throughout the mocks for
 * feature bullets (small) and brand/hero marks (large).
 */
export function IconTile({
  children,
  tone = "brand",
  size = "sm",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        TONES[tone],
        SIZES[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
