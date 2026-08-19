// PROTOTYPE — throwaway. See PROTOTYPE_README.md.
"use client";

import { PrototypeSwitcher } from "@/components/PrototypeSwitcher";
import { VariantA, VARIANT_A_NAME } from "./VariantA";
import { VariantB, VARIANT_B_NAME } from "./VariantB";
import { VariantC, VARIANT_C_NAME } from "./VariantC";

const NAMES = { A: VARIANT_A_NAME, B: VARIANT_B_NAME, C: VARIANT_C_NAME };

export function PrototypeRun({ variant }: { variant: string }) {
  const key = variant in NAMES ? variant : "A";
  return (
    <>
      {key === "A" && <VariantA />}
      {key === "B" && <VariantB />}
      {key === "C" && <VariantC />}
      <PrototypeSwitcher variants={["A", "B", "C"]} current={key} names={NAMES} />
    </>
  );
}
