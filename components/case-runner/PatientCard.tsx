import { UserRound } from "lucide-react";

/**
 * The mocks' patient briefing card: a hatched avatar tile beside the case
 * presentation. The mocks show a structured "Homem, 34 anos" line, but a
 * CaseSpec's baseCase only carries a prose narrative — so the narrative is
 * rendered here rather than inventing schema fields to split it into.
 */
export function PatientCard({ narrative }: { narrative: string }) {
  return (
    <div className="flex gap-3.5 rounded-[18px] border border-[rgba(20,58,107,0.1)] bg-card p-4 shadow-[0_16px_40px_-30px_rgba(13,59,102,0.6)]">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[repeating-linear-gradient(45deg,#e6ebf3,#e6ebf3_6px,#eef2f8_6px,#eef2f8_12px)] text-[#9aa7b5]">
        <UserRound className="size-7" />
      </span>
      <p className="self-center text-[15px] leading-relaxed whitespace-pre-line">{narrative}</p>
    </div>
  );
}
