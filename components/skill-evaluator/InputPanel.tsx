"use client";

import { useRef, useState } from "react";
import { FileArrowUp, Warning, X } from "@phosphor-icons/react/dist/ssr";
import type { ReferenceFile } from "@/lib/skill-evaluator/types";

const SAMPLE_SKILL_MD = `---
name: grill-me
description: Interview the user about a plan until reaching shared understanding
disable-model-invocation: true
---

# grill-me

Trabalhe em vertical slice: faça uma pergunta por vez, uma de cada vez, e não
avance pro plano enquanto o branch atual não estiver resolvido.

## Perguntas de esclarecimento

Pergunte ao usuário sobre escopo, restrições e critério de sucesso antes de
propor qualquer solução.
`;

export function InputPanel({
  skillMd,
  onSkillMdChange,
  referenceFiles,
  onReferenceFilesChange,
  onSubmit,
}: {
  skillMd: string;
  onSkillMdChange: (value: string) => void;
  referenceFiles: ReferenceFile[];
  onReferenceFilesChange: (files: ReferenceFile[]) => void;
  onSubmit: () => void;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const refFileInputRef = useRef<HTMLInputElement>(null);

  async function readFilesAsText(fileList: FileList): Promise<ReferenceFile[]> {
    const files = Array.from(fileList);
    return Promise.all(
      files.map(
        (file) =>
          new Promise<ReferenceFile>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ name: file.name, content: String(reader.result ?? "") });
            reader.onerror = () => reject(new Error(`Não foi possível ler o arquivo "${file.name}".`));
            reader.readAsText(file);
          }),
      ),
    );
  }

  async function handleMainFile(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setReadError(null);
    try {
      const [parsed] = await readFilesAsText(fileList);
      onSkillMdChange(parsed.content);
    } catch (err) {
      setReadError(err instanceof Error ? err.message : "Falha ao ler o arquivo.");
    }
  }

  async function handleRefFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setReadError(null);
    try {
      const parsed = await readFilesAsText(fileList);
      const existingNames = new Set(referenceFiles.map((f) => f.name));
      const deduped = parsed.filter((f) => !existingNames.has(f.name));
      onReferenceFilesChange([...referenceFiles, ...deduped]);
    } catch (err) {
      setReadError(err instanceof Error ? err.message : "Falha ao ler os arquivos.");
    }
  }

  function removeRefFile(name: string) {
    onReferenceFilesChange(referenceFiles.filter((f) => f.name !== name));
  }

  const canSubmit = skillMd.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div
        className={`rounded-xl border-2 border-dashed p-4 transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-500/5"
            : "border-zinc-200 dark:border-zinc-800"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          void handleMainFile(e.dataTransfer.files);
        }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <label htmlFor="skill-md-input" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            SKILL.md
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSkillMdChange(SAMPLE_SKILL_MD)}
              className="font-mono text-xs text-zinc-500 underline decoration-dotted underline-offset-4 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-zinc-400 dark:hover:text-zinc-300 dark:focus-visible:ring-offset-zinc-950"
            >
              usar exemplo
            </button>
            <button
              type="button"
              onClick={() => mainFileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:focus-visible:ring-offset-zinc-950"
            >
              <FileArrowUp className="size-3.5" />
              Upload
            </button>
            <input
              ref={mainFileInputRef}
              type="file"
              accept=".md,.txt"
              className="hidden"
              onChange={(e) => void handleMainFile(e.target.files)}
            />
          </div>
        </div>
        <textarea
          id="skill-md-input"
          value={skillMd}
          onChange={(e) => onSkillMdChange(e.target.value)}
          placeholder="Cole aqui o conteúdo do SKILL.md, ou arraste um arquivo .md pra essa área"
          rows={14}
          className="w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Arquivos de referência
          </span>
          <button
            type="button"
            onClick={() => refFileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:focus-visible:ring-offset-zinc-950"
          >
            <FileArrowUp className="size-3.5" />
            Adicionar
          </button>
          <input
            ref={refFileInputRef}
            type="file"
            accept=".md,.txt"
            multiple
            className="hidden"
            onChange={(e) => void handleRefFiles(e.target.files)}
          />
        </div>
        <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
          Opcional: outros arquivos que o SKILL.md referencia (progressive disclosure), usados
          para checar se as referências batem.
        </p>
        {referenceFiles.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {referenceFiles.map((f) => (
              <li
                key={f.name}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-mono text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                {f.name}
                <button
                  type="button"
                  onClick={() => removeRefFile(f.name)}
                  aria-label={`Remover ${f.name}`}
                  className="rounded text-zinc-400 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:hover:text-zinc-200"
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {readError && (
        <div className="flex gap-3 rounded-lg bg-rose-500/10 p-3 ring-1 ring-inset ring-rose-500/20">
          <Warning weight="fill" className="mt-0.5 size-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <p className="text-sm text-rose-800 dark:text-rose-300">{readError}</p>
        </div>
      )}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={onSubmit}
        className="self-start rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-transform enabled:hover:bg-blue-500 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
      >
        Avaliar skill
      </button>
    </div>
  );
}
