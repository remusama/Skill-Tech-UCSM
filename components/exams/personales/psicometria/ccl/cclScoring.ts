import { cclItems, CCLDimension } from "./cclItems";

export type CCLAnswer = { itemId: number; value: number };

export type CCLLevel = "bajo" | "medio" | "alto";

export type CCLScore = {
  scores: Record<CCLDimension, number>;
  levels: Record<CCLDimension, CCLLevel>;
  nivelGeneral: number;
};

export function getCCLLevel(score: number): CCLLevel {
  if (score <= 13) return "bajo";
  if (score <= 21) return "medio";
  return "alto";
}

export const CCL_LEVEL_LABEL: Record<CCLLevel, string> = {
  bajo: "Bajo — área prioritaria de desarrollo",
  medio: "Medio — competencia presente pero inconsistente",
  alto: "Alto — competencia consolidada, punto fuerte",
};

const EMPTY_SCORES = (): Record<CCLDimension, number> => ({
  mando_crisis: 0,
  vision_inspiracion: 0,
  empatia_vinculo: 0,
  decision_participativa: 0,
  altos_estandares: 0,
  coaching_desarrollo: 0,
});

export function scoreCCLTest(answers: CCLAnswer[]): CCLScore {
  const scores = EMPTY_SCORES();
  for (const ans of answers) {
    const item = cclItems.find((i) => i.id === ans.itemId);
    if (item) scores[item.dimension] += ans.value;
  }
  const levels = Object.fromEntries(
    (Object.keys(scores) as CCLDimension[]).map((d) => [d, getCCLLevel(scores[d])])
  ) as Record<CCLDimension, CCLLevel>;
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const nivelGeneral = Math.round((total / (36 * 5)) * 100);
  return { scores, levels, nivelGeneral };
}
