// PROTOTYPE — throwaway. See PROTOTYPE_README.md.
"use client";

import { PrototypeSwitcher } from "@/components/PrototypeSwitcher";
import { VariantA, VARIANT_A_NAME } from "./VariantA";
import { VariantB, VARIANT_B_NAME } from "./VariantB";
import { VariantC, VARIANT_C_NAME } from "./VariantC";
import { VariantD, VARIANT_D_NAME } from "./VariantD";

// D is the composition picked from the first round (monitor from A + timestamped
// log from C); A/B/C stay reachable for comparison until D is folded in for real.
const NAMES = {
  D: VARIANT_D_NAME,
  A: VARIANT_A_NAME,
  B: VARIANT_B_NAME,
  C: VARIANT_C_NAME,
};

export function PrototypeRun({ variant }: { variant: string }) {
  const key = variant in NAMES ? variant : "D";
  return (
    <>
      {key === "D" && <VariantD />}
      {key === "A" && <VariantA />}
      {key === "B" && <VariantB />}
      {key === "C" && <VariantC />}
      <PrototypeSwitcher variants={["D", "A", "B", "C"]} current={key} names={NAMES} />
    </>
  );
}
