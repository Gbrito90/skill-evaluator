"use client";

import type { AxisResult } from "@/lib/skill-evaluator/types";
import { VerdictBadge } from "./VerdictBadge";
import { ManualChecklist } from "./ManualChecklist";

const AXIS_HINT: Record<AxisResult["key"], string> = {
  gatilho: "quem aciona a skill decide quem paga a conta",
  estrutura: "o SKILL.md pequeno é o objetivo, não um efeito colateral",
  direcionamento: "leading words em vez de instrução longa",
  poda: "os 5 jeitos de uma skill dar errado sem você perceber",
};

export function AxisCard({
  axis,
  checkedIds,
  onToggle,
}: {
  axis: AxisResult;
  checkedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{axis.title}</h2>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{AXIS_HINT[axis.key]}</p>
        </div>
        <VerdictBadge verdict={axis.verdict} />
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {axis.findings.map((finding, i) => (
          <li key={i} className="flex gap-3">
            <VerdictBadge verdict={finding.verdict} size="sm" />
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{finding.label}</p>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{finding.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      <ManualChecklist items={axis.manualChecks} checkedIds={checkedIds} onToggle={onToggle} />
    </div>
  );
}
