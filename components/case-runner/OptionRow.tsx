import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { Option, OptionCall } from "@/lib/engine/types";

/** The mocks' choice-row shape: soft grey fill, 1.5px border, blue on hover. */
const ROW =
  "rounded-[13px] border-[1.5px] border-[rgba(20,58,107,0.14)] bg-[#f7f9fc] transition-colors hover:border-sky hover:bg-[#eef4ff]";

/** Segmented correct/incorrect control — a plain button pair reads as the mocks' inline choices. */
function CallButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-50",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function OptionRow({
  option,
  call,
  onCallChange,
  disabled,
}: {
  option: Pick<Option, "id" | "text">;
  call: OptionCall | undefined;
  onCallChange: (id: string, call: OptionCall) => void;
  disabled: boolean;
}) {
  const t = useTranslations("evolution");

  return (
    <div data-testid={`option-${option.id}`} className={cn(ROW, "flex flex-col gap-3 p-4")}>
      <p className="text-[15px] leading-snug">{option.text}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex gap-1.5">
          <CallButton
            active={call === "correct"}
            disabled={disabled}
            onClick={() => onCallChange(option.id, "correct")}
          >
            {t("correct")}
          </CallButton>
          <CallButton
            active={call === "incorrect"}
            disabled={disabled}
            onClick={() => onCallChange(option.id, "incorrect")}
          >
            {t("incorrect")}
          </CallButton>
        </div>
        <Label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <RadioGroupItem value={option.id} disabled={disabled} />
          {t("mostDangerous")}
        </Label>
      </div>
    </div>
  );
}
