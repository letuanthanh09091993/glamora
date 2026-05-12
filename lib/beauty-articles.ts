import type { Language } from "@/lib/i18n";

/** Outbound citation only — Glamora does not paraphrase medical claims beyond pointing to these pages. */
export type BeautyArticleSource = {
  url: string;
  label: Record<Language, string>;
};

export type BeautyArticle = {
  id: string;
  title: Record<Language, string>;
  /** Describes what each listed organization publishes on its own pages (no unsolicited advice). */
  excerpt: Record<Language, string>;
  sources: BeautyArticleSource[];
};

/** Calendar day index in Asia/Ho_Chi_Minh — same “today” for everyone in Vietnam. */
export function getVietnamDayIndex(date = new Date()): number {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

const ARTICLES: BeautyArticle[] = [
  {
    id: "sun-protection-cdc-scf",
    title: {
      VN: "Chống nắng & phòng ngừa ung thư da: CDC và Skin Cancer Foundation",
      EN: "Sun protection & skin cancer prevention: CDC and Skin Cancer Foundation",
    },
    excerpt: {
      VN:
        "CDC có mục về ung thư da và bảo vệ da dưới ánh nắng; Skin Cancer Foundation có trang giáo dục về sunscreen (tổ chức phi lợi nhuận về da & ung thư da). Glamora chỉ dẫn link — không bổ sung lời khuyên điều trị.",
      EN:
        "CDC publishes skin cancer information and guidance on protecting skin from sun exposure; Skin Cancer Foundation hosts educational sunscreen guidance (nonprofit focused on skin health and skin cancer prevention). Glamora links only—we do not add treatment advice.",
    },
    sources: [
      {
        url: "https://www.cdc.gov/skin-cancer/index.html",
        label: {
          VN: "CDC — Skin Cancer (United States)",
          EN: "CDC — Skin Cancer (United States)",
        },
      },
      {
        url: "https://www.skincancer.org/skin-cancer-prevention/sun-protection/sunscreen/",
        label: {
          VN: "Skin Cancer Foundation — Sunscreen",
          EN: "Skin Cancer Foundation — Sunscreen",
        },
      },
    ],
  },
  {
    id: "nih-acne-overview",
    title: {
      VN: "Mụn trứng cá: tài liệu NIH/NIAMS (Viện Y tế Quốc gia Hoa Kỳ)",
      EN: "Acne: NIH/NIAMS patient overview (United States)",
    },
    excerpt: {
      VN:
        "NIAMS mô tả mụn là bệnh da phổ biến liên quan đến tắc nang lông, nhờn và viêm — theo trang đã liệt kê. Chi tiết chẩn đoán/điều trị do bác sĩ quyết định.",
      EN:
        "NIAMS describes acne as clogged follicles involving sebum, dead skin cells, and inflammation—as stated on its health topic pages. Diagnosis/treatment belongs with a clinician.",
    },
    sources: [
      {
        url: "https://www.niams.nih.gov/health-topics/acne",
        label: { VN: "NIAMS — Acne overview", EN: "NIAMS — Acne overview" },
      },
    ],
  },
  {
    id: "nih-psoriasis-overview",
    title: {
      VN: "Vảy nến (psoriasis): tài liệu NIH/NIAMS",
      EN: "Psoriasis: NIH/NIAMS patient overview",
    },
    excerpt: {
      VN:
        "NIAMS mô tả vảy nến là bệnh da mạn tính, liên quan miễn dịch khiến tế bào sừng tăng sinh quá nhanh — đúng theo phần tóm tắt trên trang nguồn.",
      EN:
        "NIAMS describes psoriasis as immune-mediated accelerated skin-cell turnover—matching the institute’s patient-facing summary.",
    },
    sources: [
      {
        url: "https://www.niams.nih.gov/health-topics/psoriasis",
        label: {
          VN: "NIAMS — Psoriasis overview",
          EN: "NIAMS — Psoriasis overview",
        },
      },
    ],
  },
  {
    id: "fda-cosmetics-consumer-hub",
    title: {
      VN: "Mỹ phẩm & an toàn: trang chủ chủ đề Cosmetics của FDA",
      EN: "Cosmetics safety topics: FDA Cosmetics hub",
    },
    excerpt: {
      VN:
        "FDA là cơ quan quản lý tại Hoa Kỳ; cổng Cosmetics tổng hợp chủ đề như allergens, fragrances, báo cáo phản ứng, thu hồi — độc giả căn cứ vào các trang con được liệt kê đó.",
      EN:
        "FDA’s Cosmetics landing page organizes consumer-facing topics (allergens, fragrances, recalls, adverse events). Readers should rely on those linked subpages.",
    },
    sources: [
      {
        url: "https://www.fda.gov/cosmetics",
        label: { VN: "FDA — Cosmetics", EN: "FDA — Cosmetics" },
      },
    ],
  },
  {
    id: "fda-allergens-cosmetics",
    title: {
      VN: "Dị ứng mỹ phẩm: FDA về allergens & viêm tiếp xúc",
      EN: "Cosmetic allergens: FDA overview & contact dermatitis",
    },
    excerpt: {
      VN:
        "FDA giải thích da có thể phản ứng dị ứng với mỹ phẩm và mô tả triệu chứng như viêm tiếp xúc ngứa, đỏ — theo bản có trên trang nguồn.",
      EN:
        "FDA explains that cosmetics may trigger allergic reactions, often presenting as contact dermatitis (for example itch or redness), as summarized on FDA’s allergens page.",
    },
    sources: [
      {
        url: "https://www.fda.gov/cosmetics/cosmetic-ingredients/allergens-cosmetics",
        label: {
          VN: "FDA — Allergens in cosmetics",
          EN: "FDA — Allergens in cosmetics",
        },
      },
    ],
  },
  {
    id: "fda-report-cosmetic-complaint",
    title: {
      VN: "Phản ứng sau dùng mỹ phẩm: cách báo cáo tới FDA",
      EN: "Adverse reactions: how FDA accepts cosmetic complaints",
    },
    excerpt: {
      VN:
        "FDA hướng dẫn người tiêu dùng/ngành làm những việc đầu tiên và kênh gửi khi có phản ứng như rash, redness, infection — được mô tả trên trang chính thức liên quan đến khiếu nại mỹ phẩm.",
      EN:
        "FDA publishes steps for consumers and professionals to report rash, discoloration, illness, contamination, etc.—see the cosmetics complaint guidance page.",
    },
    sources: [
      {
        url: "https://www.fda.gov/cosmetics/cosmetics-compliance-enforcement/how-report-cosmetic-product-related-complaint",
        label: {
          VN: "FDA — Report a cosmetic complaint",
          EN: "FDA — Report a cosmetic complaint",
        },
      },
    ],
  },
  {
    id: "fda-recalls-market",
    title: {
      VN: "Thu hồi & cảnh báo an toàn sản phẩm FDA (bao gồm cosmetics)",
      EN: "FDA recalls, withdrawals & safety alerts (filterable)",
    },
    excerpt: {
      VN:
        "FDA công bố danh sách thông báo thu hồi và cảnh báo có thể lọc theo loại sản phẩm như Cosmetics — không phụ thuộc vào tóm lược của Glamora.",
      EN:
        "FDA maintains a searchable list of recalls and alerts; cosmetics can be filtered among product types—not summarized here.",
    },
    sources: [
      {
        url: "https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts",
        label: {
          VN: "FDA — Recalls, Market Withdrawals & Safety Alerts",
          EN: "FDA — Recalls, Market Withdrawals & Safety Alerts",
        },
      },
    ],
  },
  {
    id: "fda-henna-black-henna",
    title: {
      VN: "Henna/xăm dán & “black henna”: bản Fact Sheet của FDA",
      EN: "Henna/decal tattoos & “black henna”: FDA fact sheet",
    },
    excerpt: {
      VN:
        "FDA nhắc henna chỉ được phê duyệt cho thuốc nhuộm tóc, không phải để quét trực tiếp lên da; “black henna” có liên quan PPD không được cho phép trong mỹ phẩm bôi da — được trình bày trong fact sheet của FDA.",
      EN:
        "FDA explains approved uses of henna (hair dye) versus skin application, warns about PPD-containing “black henna,” and links reporting steps—verbatim policy is on FDA’s temporary tattoo page.",
    },
    sources: [
      {
        url: "https://www.fda.gov/cosmetics/cosmetic-products/temporary-tattoos-hennamehndi-and-black-henna-fact-sheet",
        label: {
          VN: "FDA — Temporary tattoos, henna, black henna",
          EN: "FDA — Temporary tattoos, henna, black henna",
        },
      },
    ],
  },
  {
    id: "cdc-handwashing-clean-hands",
    title: {
      VN: "Rửa tay đúng cách — CDC About Handwashing",
      EN: "Hand hygiene basics — CDC",
    },
    excerpt: {
      VN:
        "CDC nêu thời điểm cần rửa tay, các bước với xà phòng và nước chảy hoặc dung dịch chứa ≥60% cồn — nội dung lấy từ trang chính thức.",
      EN:
        "CDC documents key times for hand washing, the five-step soap-and-water technique, or ≥60% alcohol sanitizer guidance—straight from CDC’s About Handwashing page.",
    },
    sources: [
      {
        url: "https://www.cdc.gov/handwashing/index.html",
        label: {
          VN: "CDC — About handwashing",
          EN: "CDC — About handwashing",
        },
      },
    ],
  },
  {
    id: "fda-fragrances-cosmetics",
    title: {
      VN: "Hương liệu trong mỹ phẩm: FDA về Fragrance và ghi nhãn",
      EN: "Fragrances in cosmetics: FDA labeling FAQs",
    },
    excerpt: {
      VN:
        "FDA giải thích thế nào là sản phẩm hương được xem là cosmetic, và vì sao trong nhiều trường hợp thành phần chỉ được ghi là “Fragrance/Perfume” — theo trang Fragrances của FDA.",
      EN:
        "FDA distinguishes fragrance products marketed as cosmetics, explains trade-secret labeling allowances, and notes fragrance sensitivities—see FDA’s fragrances page.",
    },
    sources: [
      {
        url: "https://www.fda.gov/cosmetics/cosmetic-ingredients/fragrances-cosmetics",
        label: {
          VN: "FDA — Fragrances in cosmetics",
          EN: "FDA — Fragrances in cosmetics",
        },
      },
    ],
  },
  {
    id: "fda-cosmetic-products-responsibilities",
    title: {
      VN: "Trách nhiệm của công ty mỹ phẩm: FDA về an toàn sản phẩm",
      EN: "Who is responsible for cosmetic safety?",
    },
    excerpt: {
      VN:
        "FDA nhắc những marketer mỹ phẩm phải bảo đảm sản phẩm an toàn theo chỉ dẫn trên nhãn và cơ quan có quyền giám sát thực thi — được mô tả trong mục “Safety of cosmetic products and ingredients”.",
      EN:
        "FDA summarizes legal responsibilities for assuring cosmetic safety under labeled directions and summarizes enforcement posture—consult FDA’s Cosmetic Products landing section.",
    },
    sources: [
      {
        url: "https://www.fda.gov/cosmetics/cosmetic-products-ingredients/cosmetic-products",
        label: {
          VN: "FDA — Cosmetic products & ingredients overview",
          EN: "FDA — Cosmetic products & ingredients overview",
        },
      },
    ],
  },
  {
    id: "fda-prohibited-restricted-cosmetics",
    title: {
      VN: "Thành phần cấm/hạn chế trong mỹ phẩm (Hoa Kỳ): CFR liệt kê của FDA",
      EN: "Prohibited/restricted cosmetic ingredients — FDA CFR summary",
    },
    excerpt: {
      VN:
        "FDA công khai các thành phần bị cấm hoặc hạn chế theo điều lệ CFR (ví dụ một số mercury, mercury eye-area limits, các hợp chất aerosol…) — chỉ căn cứ bảng trên trang nguồn.",
      EN:
        "FDA catalogs CFR-prohibited or restricted cosmetic ingredients with cited rule sections (examples include certain mercury allowances, aerosol bans, vinyl chloride)—read the authoritative table directly.",
    },
    sources: [
      {
        url: "https://www.fda.gov/cosmetics/laws-regulations/prohibited-restricted-ingredients",
        label: {
          VN: "FDA — Prohibited & restricted ingredients",
          EN: "FDA — Prohibited & restricted ingredients",
        },
      },
    ],
  },
];

export function getBeautyArticlesForDay(language: Language, dayIndex = getVietnamDayIndex()) {
  const n = ARTICLES.length;
  const offset = ((dayIndex % n) + n) % n;
  const spotlight = ARTICLES[offset]!;
  const others = [1, 2, 3].map((i) => ARTICLES[(offset + i) % n]!);
  return {
    spotlight,
    others,
    resolve: (a: BeautyArticle) => ({
      title: a.title[language],
      excerpt: a.excerpt[language],
      sources: a.sources.map((s) => ({ url: s.url, label: s.label[language] })),
    }),
  };
}
