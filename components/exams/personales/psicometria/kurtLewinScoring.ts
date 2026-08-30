import { kurtLewinItems, LeadershipStyle } from "./kurtLewinItems";

export type LewinAnswer = { itemId: number; value: "A" | "D" };

export type LewinScore = {
  autoritario: number;
  democratico: number;
  "laissez-faire": number;
  dominant: LeadershipStyle;
  isTied: boolean;
};

export function scoreLewinTest(answers: LewinAnswer[]): LewinScore {
  const counts: Record<LeadershipStyle, number> = { autoritario: 0, democratico: 0, "laissez-faire": 0 };
  for (const ans of answers) {
    if (ans.value !== "A") continue;
    const item = kurtLewinItems.find((i) => i.id === ans.itemId);
    if (item) counts[item.style]++;
  }
  const max = Math.max(counts.autoritario, counts.democratico, counts["laissez-faire"]);
  const winners = (Object.keys(counts) as LeadershipStyle[]).filter((k) => counts[k] === max);
  return { ...counts, dominant: winners[0], isTied: winners.length > 1 };
}
