import { parseFrontmatter } from "./frontmatter";
import {
  CLARIFYING_QUESTION_KEYWORDS,
  GENERIC_INSTRUCTION_PATTERNS,
  KNOWN_LEADING_WORDS,
  PLANNING_KEYWORDS,
} from "./leadingWords";
import type {
  AxisFinding,
  AxisResult,
  EvaluationInput,
  EvaluationReport,
  ManualCheckItem,
  ReferenceFile,
  Verdict,
} from "./types";

const VERDICT_RANK: Record<Verdict, number> = { good: 0, warning: 1, critical: 2 };

function worstVerdict(items: { verdict: Verdict }[]): Verdict {
  return items.reduce<Verdict>(
    (acc, item) => (VERDICT_RANK[item.verdict] > VERDICT_RANK[acc] ? item.verdict : acc),
    "good",
  );
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function splitParagraphs(body: string): string[] {
  return body
    .split(/\r?\n\r?\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !/^#{1,6}\s/.test(p));
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toWordSet(text: string): Set<string> {
  return new Set(normalize(text).split(" ").filter(Boolean));
}

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const word of setA) if (setB.has(word)) intersection += 1;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Above this many paragraphs, pairwise comparison is skipped and the check
// is handed off to the manual checklist instead of freezing the UI thread.
const MAX_PARAGRAPHS_FOR_DUPLICATION_CHECK = 80;

function extractH2Sections(body: string): string[] {
  const matches = body.match(/^##\s+.+$/gm) ?? [];
  return matches.map((m) => m.replace(/^##\s+/, "").trim());
}

function extractExternalReferences(body: string): string[] {
  const refs = new Set<string>();
  const linkPattern = /\[[^\]]*\]\(([^)]+\.md)\)/gi;
  const bareMentionPattern = /`([\w-]+\.md)`/gi;
  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(body))) refs.add(match[1]);
  while ((match = bareMentionPattern.exec(body))) refs.add(match[1]);
  return Array.from(refs);
}

function evaluateGatilho(frontmatter: Record<string, string>): AxisResult {
  const findings: AxisFinding[] = [];
  const manualChecks: ManualCheckItem[] = [];

  const disableModelInvocation =
    (frontmatter["disable-model-invocation"] ?? "").trim().toLowerCase() === "true";
  const description = frontmatter["description"] ?? "";

  if (disableModelInvocation) {
    findings.push({
      label: "Acionamento explícito por usuário",
      detail:
        "disable-model-invocation: true está presente. Custo de contexto zero, mas você precisa lembrar que essa skill existe (cognitive load fica com você).",
      verdict: "good",
    });
  } else if (description) {
    const wc = wordCount(description);
    if (wc < 4) {
      findings.push({
        label: "Descrição de gatilho muito curta",
        detail: `A description tem só ${wc} palavra(s). Descrição vaga demais faz o agente ignorar a skill mesmo quando ela seria perfeita para a tarefa.`,
        verdict: "warning",
      });
    } else {
      findings.push({
        label: "Acionamento por modelo (model-invoked)",
        detail:
          "Description presente e sem disable-model-invocation. Isso deixa a descrição permanente no contexto, cobrando token em toda requisição futura (context load) em troca de não precisar lembrar da skill (cognitive load).",
        verdict: "good",
      });
    }
  } else {
    findings.push({
      label: "Sem description e sem disable-model-invocation",
      detail:
        "Sem description o modelo não tem como decidir sozinho quando usar a skill, e sem disable-model-invocation não está explícito que é só uso manual. Configuração ambígua.",
      verdict: "critical",
    });
  }

  manualChecks.push({
    id: "gatilho-trade-off",
    label: "Confirme a escolha do gatilho de propósito",
    description:
      "Essa skill é usada com tanta frequência que vale pagar cognitive load (lembrar dela) para economizar context load? Ou é rara o bastante para deixar o modelo decidir sozinho?",
  });

  return {
    key: "gatilho",
    title: "Gatilho",
    verdict: worstVerdict(findings),
    findings,
    manualChecks,
  };
}

function evaluateEstrutura(body: string, referenceFiles: ReferenceFile[]): AxisResult {
  const findings: AxisFinding[] = [];
  const manualChecks: ManualCheckItem[] = [];

  const wc = wordCount(body);
  const sections = extractH2Sections(body);
  const externalRefs = extractExternalReferences(body);
  const providedNames = new Set(referenceFiles.map((f) => f.name.toLowerCase()));
  const mentionedNames = new Set(externalRefs.map((r) => r.split(/[/\\]/).pop()!.toLowerCase()));

  if (referenceFiles.length > 0) {
    const missing = externalRefs.filter((r) => !providedNames.has(r.split(/[/\\]/).pop()!.toLowerCase()));
    const unused = referenceFiles.filter((f) => !mentionedNames.has(f.name.toLowerCase()));

    if (missing.length > 0) {
      findings.push({
        label: `${missing.length} referência(s) citada(s) no SKILL.md sem arquivo correspondente`,
        detail: `${missing.join(", ")} são mencionados no corpo mas não foram enviados como arquivo de referência.`,
        verdict: "warning",
      });
    }
    if (unused.length > 0) {
      findings.push({
        label: `${unused.length} arquivo(s) de referência nunca mencionado(s) no SKILL.md`,
        detail: `${unused.map((f) => f.name).join(", ")} foram enviados mas o corpo principal não referencia esses nomes. Pode ser sedimento.`,
        verdict: "warning",
      });
    }
    if (missing.length === 0 && unused.length === 0) {
      findings.push({
        label: "Referências e arquivos enviados batem",
        detail: `${referenceFiles.length} arquivo(s) de referência enviados, todos mencionados no SKILL.md e vice-versa.`,
        verdict: "good",
      });
    }
  }

  if (wc > 900 && externalRefs.length === 0) {
    findings.push({
      label: "SKILL.md longo sem referência externa",
      detail: `O corpo tem ${wc} palavras e nenhum arquivo de referência externo foi detectado. Candidata a progressive disclosure: mova material de apoio para fora do arquivo principal.`,
      verdict: "critical",
    });
  } else if (wc > 500 && externalRefs.length === 0) {
    findings.push({
      label: "SKILL.md no limite",
      detail: `${wc} palavras no corpo principal sem referência externa. Se a skill tiver múltiplos branches, considere dividir.`,
      verdict: "warning",
    });
  } else {
    findings.push({
      label: "Tamanho do SKILL.md sob controle",
      detail: `${wc} palavras no corpo principal${externalRefs.length > 0 ? `, com ${externalRefs.length} referência(s) externa(s) detectada(s)` : ""}.`,
      verdict: "good",
    });
  }

  if (sections.length >= 3 && externalRefs.length === 0) {
    findings.push({
      label: `${sections.length} branches detectados, zero referência externa`,
      detail: `Seções: ${sections.slice(0, 5).join(", ")}${sections.length > 5 ? "..." : ""}. Cada branch usa material diferente; considere mover o que não coexiste na mesma execução para fora do arquivo principal.`,
      verdict: "warning",
    });
  }

  if (externalRefs.length > 0) {
    findings.push({
      label: "Referências externas encontradas",
      detail: externalRefs.join(", "),
      verdict: "good",
    });
  }

  manualChecks.push({
    id: "estrutura-branches",
    label: "Confirme separação passos vs. referência",
    description:
      "Toda skill boa se divide em passos (o procedimento) e referência (material de apoio). Verifique se o que está no SKILL.md principal é só o procedimento, e se o material de apoio de cada branch está isolado em arquivo próprio.",
  });

  return {
    key: "estrutura",
    title: "Estrutura",
    verdict: worstVerdict(findings),
    findings,
    manualChecks,
  };
}

function evaluateDirecionamento(body: string): AxisResult {
  const findings: AxisFinding[] = [];
  const manualChecks: ManualCheckItem[] = [];
  const lowerBody = body.toLowerCase();

  const foundLeadingWords = KNOWN_LEADING_WORDS.filter((w) => lowerBody.includes(w));
  if (foundLeadingWords.length > 0) {
    findings.push({
      label: `${foundLeadingWords.length} leading word(s) reconhecida(s)`,
      detail: foundLeadingWords.slice(0, 8).join(", "),
      verdict: "good",
    });
  } else {
    findings.push({
      label: "Nenhuma leading word conhecida encontrada",
      detail:
        "Termos que carregam significado inteiro no pré-treino do modelo (ex: vertical slice, idempotente, feature flag) tendem a funcionar melhor que instrução longa. Considere se algum trecho pode virar leading word.",
      verdict: "warning",
    });
  }

  const genericMatches = GENERIC_INSTRUCTION_PATTERNS.filter((re) => re.test(body));
  if (genericMatches.length > 0) {
    findings.push({
      label: `${genericMatches.length} instrução(ões) genérica(s) detectada(s)`,
      detail:
        "Frases como 'faça o melhor possível' ou 'de forma adequada' forçam o agente a reconstruir o conceito toda vez em vez de reconhecê-lo de cara. Troque por um termo técnico específico.",
      verdict: "warning",
    });
  }

  const hasPlanning = PLANNING_KEYWORDS.some((re) => re.test(body));
  const hasClarifying = CLARIFYING_QUESTION_KEYWORDS.some((re) => re.test(body));
  if (hasPlanning && hasClarifying) {
    findings.push({
      label: "Planejamento e perguntas de esclarecimento misturados",
      detail:
        "A skill parece conter tanto a etapa de perguntas quanto a de geração do plano. O agente enxerga o objetivo final e tende a correr pelas perguntas. Considere separar em duas skills distintas.",
      verdict: "critical",
    });
  }

  manualChecks.push({
    id: "direcionamento-reasoning-trace",
    label: "Teste a leading word no reasoning trace",
    description:
      "Rode a skill e observe o raciocínio do agente. Se a leading word aparece de volta no reasoning trace, ela pegou. Se não aparece, é fraca demais e precisa ser trocada.",
  });

  return {
    key: "direcionamento",
    title: "Direcionamento",
    verdict: worstVerdict(findings),
    findings,
    manualChecks,
  };
}

function evaluatePoda(body: string): AxisResult {
  const findings: AxisFinding[] = [];
  const manualChecks: ManualCheckItem[] = [];

  const paragraphs = splitParagraphs(body).filter((p) => wordCount(p) > 12);

  if (paragraphs.length > MAX_PARAGRAPHS_FOR_DUPLICATION_CHECK) {
    findings.push({
      label: "SKILL.md grande demais para checagem automática de duplicação",
      detail: `${paragraphs.length} parágrafos elegíveis, acima do limite de ${MAX_PARAGRAPHS_FOR_DUPLICATION_CHECK}. Use o teste do no-op manualmente para essa skill.`,
      verdict: "warning",
    });
  } else {
    const wordSets = paragraphs.map(toWordSet);
    const duplicatePairs: string[] = [];
    for (let i = 0; i < paragraphs.length; i += 1) {
      for (let j = i + 1; j < paragraphs.length; j += 1) {
        const sim = jaccardSimilarity(wordSets[i], wordSets[j]);
        if (sim > 0.6) {
          duplicatePairs.push(`Parágrafos ${i + 1} e ${j + 1} (${Math.round(sim * 100)}% de sobreposição)`);
        }
      }
    }

    if (duplicatePairs.length > 0) {
      findings.push({
        label: `${duplicatePairs.length} duplicação(ões) provável(is)`,
        detail: `${duplicatePairs.slice(0, 3).join("; ")}. Regra: cada peça de referência tem uma única fonte de verdade.`,
        verdict: "critical",
      });
    } else {
      findings.push({
        label: "Nenhuma duplicação óbvia encontrada",
        detail: "Comparação de parágrafos não encontrou sobreposição alta de conteúdo.",
        verdict: "good",
      });
    }
  }

  const sections = extractH2Sections(body);
  const wc = wordCount(body);
  if (sections.length > 6 && wc > 900) {
    findings.push({
      label: "Candidata a sprawl",
      detail: `${sections.length} seções e ${wc} palavras. Verifique se a skill não absorveu responsabilidade que deveria estar em outra skill.`,
      verdict: "warning",
    });
  }

  manualChecks.push(
    {
      id: "poda-no-op",
      label: "Rode o teste do no-op",
      description:
        "Escolha um parágrafo que parece instrução, apague ele, rode a skill de novo. O resultado mudou? Se não mudou, aquele trecho nunca fez nada e está só consumindo tokens.",
    },
    {
      id: "poda-sedimento",
      label: "Verifique sedimento",
      description:
        "Existe conteúdo que foi empilhado por várias contribuições e que ninguém mais organiza ou lembra por que está lá? Se sim, é sedimento: revise e remova.",
    },
    {
      id: "poda-premature-completion",
      label: "Verifique premature completion",
      description:
        "O agente já declarou a tarefa concluída antes de realmente terminar o que a skill pedia, em execuções anteriores? Se sim, reforce o critério de conclusão no procedimento.",
    },
  );

  return {
    key: "poda",
    title: "Poda",
    verdict: worstVerdict(findings),
    findings,
    manualChecks,
  };
}

export function evaluateSkill(input: EvaluationInput): EvaluationReport {
  const { frontmatter, body } = parseFrontmatter(input.skillMd);

  const axes: AxisResult[] = [
    evaluateGatilho(frontmatter),
    evaluateEstrutura(body, input.referenceFiles),
    evaluateDirecionamento(body),
    evaluatePoda(body),
  ];

  const overallVerdict = worstVerdict(axes);

  return {
    overallVerdict,
    axes,
    frontmatter,
    wordCount: wordCount(body),
  };
}
