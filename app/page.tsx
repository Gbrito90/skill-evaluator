"use client";

import { useMemo, useState } from "react";
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import { evaluateSkill } from "@/lib/skill-evaluator/evaluate";
import type { EvaluationReport, PreCheckAnswers, ReferenceFile } from "@/lib/skill-evaluator/types";
import { InputPanel } from "@/components/skill-evaluator/InputPanel";
import { PreCheckPanel } from "@/components/skill-evaluator/PreCheckPanel";
import { AxisCard } from "@/components/skill-evaluator/AxisCard";
import { ScoreSummary } from "@/components/skill-evaluator/ScoreSummary";

type Stage = "input" | "precheck" | "report";

export default function Home() {
  const [stage, setStage] = useState<Stage>("input");
  const [skillMd, setSkillMd] = useState("");
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>([]);
  const [preCheckAnswers, setPreCheckAnswers] = useState<PreCheckAnswers>({
    repeatsRegularly: null,
    nameableInSentence: null,
  });
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const report = useMemo<EvaluationReport | null>(() => {
    if (stage !== "report") return null;
    return evaluateSkill({ skillMd, referenceFiles });
  }, [stage, skillMd, referenceFiles]);

  function toggleCheck(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reset() {
    setStage("input");
    setSkillMd("");
    setReferenceFiles([]);
    setPreCheckAnswers({ repeatsRegularly: null, nameableInSentence: null });
    setCheckedIds(new Set());
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Skill Evaluator
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Audite seu SKILL.md contra os 4 eixos
            </h1>
            <p className="mt-1 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
              Gatilho, estrutura, direcionamento e poda. Baseado no framework de
              previsibilidade de skills para agentes de código.
            </p>
          </div>
          {stage !== "input" && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:focus-visible:ring-offset-zinc-950"
            >
              <ArrowCounterClockwise className="size-3.5" />
              Nova avaliação
            </button>
          )}
        </header>

        {stage === "input" && (
          <InputPanel
            skillMd={skillMd}
            onSkillMdChange={setSkillMd}
            referenceFiles={referenceFiles}
            onReferenceFilesChange={setReferenceFiles}
            onSubmit={() => setStage("precheck")}
          />
        )}

        {stage === "precheck" && (
          <PreCheckPanel
            answers={preCheckAnswers}
            onChange={setPreCheckAnswers}
            onContinue={() => setStage("report")}
          />
        )}

        {stage === "report" && report && (
          <div className="flex flex-col gap-4">
            <ScoreSummary report={report} />
            {report.axes.map((axis) => (
              <AxisCard key={axis.key} axis={axis} checkedIds={checkedIds} onToggle={toggleCheck} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
