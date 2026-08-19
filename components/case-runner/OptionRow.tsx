import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";
import type { Option } from "@/lib/engine/types";
import type { OptionCall } from "@/lib/engine/types";

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
    <Card data-testid={`option-${option.id}`}>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex-1 text-sm">{option.text}</p>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={call === "correct" ? "default" : "outline"}
              disabled={disabled}
              onClick={() => onCallChange(option.id, "correct")}
            >
              {t("correct")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={call === "incorrect" ? "default" : "outline"}
              disabled={disabled}
              onClick={() => onCallChange(option.id, "incorrect")}
            >
              {t("incorrect")}
            </Button>
          </div>
          <Label className="flex items-center gap-1 text-xs text-muted-foreground">
            <RadioGroupItem value={option.id} disabled={disabled} />
            {t("mostDangerous")}
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
