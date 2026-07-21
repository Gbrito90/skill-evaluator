export type Verdict = "good" | "warning" | "critical";

export interface AxisFinding {
  label: string;
  detail: string;
  verdict: Verdict;
}

export interface ManualCheckItem {
  id: string;
  label: string;
  description: string;
}

export interface AxisResult {
  key: "gatilho" | "estrutura" | "direcionamento" | "poda";
  title: string;
  verdict: Verdict;
  findings: AxisFinding[];
  manualChecks: ManualCheckItem[];
}

export interface PreCheckAnswers {
  repeatsRegularly: boolean | null;
  nameableInSentence: boolean | null;
}

export interface ReferenceFile {
  name: string;
  content: string;
}

export interface EvaluationInput {
  skillMd: string;
  referenceFiles: ReferenceFile[];
}

export interface EvaluationReport {
  overallVerdict: Verdict;
  axes: AxisResult[];
  frontmatter: Record<string, string>;
  wordCount: number;
}
