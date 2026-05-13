import type { UserAccount } from "@/lib/auth-types";

export const STYLE_FILTER_IDS = ["all", "bridal", "editorial", "natural", "event", "fashion"] as const;
export type StyleFilterId = (typeof STYLE_FILTER_IDS)[number];

const STYLE_NEEDLES: Record<Exclude<StyleFilterId, "all">, readonly string[]> = {
  bridal: ["bridal", "cô dâu", "bride", "wedding", "cưới"],
  editorial: ["editorial", "campaign", "lookbook", "commercial", "chụp ảnh"],
  natural: ["natural", "tự nhiên", "minimal", "k-beauty", "kbeauty", "glow", "no-makeup"],
  event: ["event", "sự kiện", "tiệc", "evening", "party", "gala", "touch-up", "touch up"],
  fashion: ["fashion", "thời trang", "runway", "week", "tvc", "lifestyle"],
};

export function artistMatchesStyle(artist: UserAccount, styleId: StyleFilterId): boolean {
  if (styleId === "all") return true;
  const blob = [artist.bio ?? "", ...(artist.specialties ?? []), artist.username].join(" ").toLowerCase();
  const needles = STYLE_NEEDLES[styleId];
  return needles.some((n) => blob.includes(n.toLowerCase()));
}

export const HCM_DISTRICT_IDS = [
  "all",
  "q1",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q10",
  "q11",
  "q12",
  "binh_thanh",
  "tan_binh",
  "tan_phu",
  "phu_nhuan",
  "go_vap",
  "binh_tan",
  "thu_duc",
  "binh_chanh",
  "hoc_mon",
  "cu_chi",
  "nha_be",
  "can_gio",
] as const;

export type HcmDistrictId = (typeof HCM_DISTRICT_IDS)[number];

const HCM_NEEDLES: Record<Exclude<HcmDistrictId, "all">, readonly string[]> = {
  q1: ["quận 1", "quan 1", "q.1", "q1,", "q1 ", "district 1", "d1,", "d1 "],
  q3: ["quận 3", "quan 3", "district 3", "q3,", "q3 "],
  q4: ["quận 4", "quan 4", "district 4"],
  q5: ["quận 5", "quan 5", "district 5", "cho lon", "chợ lớn"],
  q6: ["quận 6", "quan 6", "district 6"],
  q7: ["quận 7", "quan 7", "district 7", "phu my hung", "phú mỹ hưng"],
  q8: ["quận 8", "quan 8", "district 8"],
  q10: ["quận 10", "quan 10", "district 10", "q10,", "q10 "],
  q11: ["quận 11", "quan 11", "district 11"],
  q12: ["quận 12", "quan 12", "district 12"],
  binh_thanh: ["bình thạnh", "binh thanh"],
  tan_binh: ["tân bình", "tan binh", "tan son nhat", "tân sơn nhất"],
  tan_phu: ["tân phú", "tan phu"],
  phu_nhuan: ["phú nhuận", "phu nhuan"],
  go_vap: ["gò vấp", "go vap"],
  binh_tan: ["bình tân", "binh tan"],
  thu_duc: ["thủ đức", "thu duc", "thu duc city", "tp thủ đức"],
  binh_chanh: ["bình chánh", "binh chanh"],
  hoc_mon: ["hóc môn", "hoc mon"],
  cu_chi: ["củ chi", "cu chi"],
  nha_be: ["nhà bè", "nha be"],
  can_gio: ["cần giờ", "can gio"],
};

export function artistMatchesHcmDistrict(artist: UserAccount, districtId: HcmDistrictId): boolean {
  if (districtId === "all") return true;
  const loc = (artist.location ?? "").toLowerCase();
  const needles = HCM_NEEDLES[districtId];
  return needles.some((n) => loc.includes(n.toLowerCase()));
}
