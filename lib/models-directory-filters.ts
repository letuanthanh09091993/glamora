import type { UserAccount } from "@/lib/auth-types";

export const MODEL_STYLE_FILTER_IDS = ["all", "editorial", "commercial", "runway", "beauty", "lifestyle"] as const;
export type ModelStyleFilterId = (typeof MODEL_STYLE_FILTER_IDS)[number];

const MODEL_STYLE_NEEDLES: Record<Exclude<ModelStyleFilterId, "all">, readonly string[]> = {
  editorial: ["editorial", "lookbook", "campaign", "studio"],
  commercial: ["commercial", "tvc", "digital", "on-set", "on set", "location"],
  runway: ["runway", "fashion week", "fashion", "show", "casting"],
  beauty: ["beauty", "glow", "skin"],
  lifestyle: ["lifestyle", "natural", "street"],
};

export function modelMatchesStyle(model: UserAccount, styleId: ModelStyleFilterId): boolean {
  if (styleId === "all") return true;
  const blob = [
    model.bio ?? "",
    model.collaborationPreferences ?? "",
    model.measurements ?? "",
    model.username,
    ...(model.specialties ?? []),
  ]
    .join(" ")
    .toLowerCase();
  const needles = MODEL_STYLE_NEEDLES[styleId];
  return needles.some((n) => blob.includes(n.toLowerCase()));
}
