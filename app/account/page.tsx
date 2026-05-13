"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { Notice } from "@/components/ui/notice";
import { HcmDistrictMultiSelect } from "@/components/ui/hcm-district-multi-select";
import { SuggestTagsField } from "@/components/ui/suggest-tags-field";
import { useAuth } from "@/components/providers/auth-provider";
import { RoleGate } from "@/components/auth/role-gate";
import { useLanguage } from "@/components/providers/language-provider";
import type { ServicePackageRow } from "@/lib/auth-types";
import { COSMETIC_BRAND_SUGGESTIONS } from "@/lib/cosmetic-brand-suggestions";
import { processAvatarImageFile } from "@/lib/process-avatar-image";
import {
  districtKeysToDisplayLine,
  districtKeysToGeocodeQuery,
  inferDistrictKeysFromLocation,
} from "@/lib/hcm-districts";
import {
  normalizeServicePackages,
  servicePackagesToSummary,
} from "@/lib/service-packages";
import { formatVndDots, vndDigitsOnly } from "@/lib/vnd-format";

export default function AccountPage() {
  return (
    <RoleGate>
      <AccountForm />
    </RoleGate>
  );
}

function AccountForm() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const { t, language } = useLanguage();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [studioAddress, setStudioAddress] = useState("");
  const [bio, setBio] = useState("");
  const [districtKeys, setDistrictKeys] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [styleTags, setStyleTags] = useState<string[]>([]);
  const [brandTags, setBrandTags] = useState<string[]>([]);
  const [packageRows, setPackageRows] = useState<ServicePackageRow[]>([
    { name: "", price: "", detail: "" },
  ]);
  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [avatarProcessing, setAvatarProcessing] = useState(false);

  const styleSuggestions = useMemo(
    () => [
      t("artistsPage.styleOptions.bridal"),
      t("artistsPage.styleOptions.editorial"),
      t("artistsPage.styleOptions.natural"),
      t("artistsPage.styleOptions.event"),
      t("artistsPage.styleOptions.fashion"),
    ],
    [t, language],
  );

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName ?? "");
    setPhone(user.phoneNumber ?? "");
    setEmail(user.email ?? "");
    setStudioAddress(user.studioAddress ?? "");
    setBio(user.bio ?? "");
    setDistrictKeys(
      user.serviceAreaDistrictKeys?.length
        ? [...user.serviceAreaDistrictKeys]
        : inferDistrictKeysFromLocation(user.location ?? ""),
    );
    setAvatarUrl(user.avatarUrl ?? "");
    setStyleTags(user.specialties?.length ? [...user.specialties] : []);
    setBrandTags(user.cosmeticBrands?.length ? [...user.cosmeticBrands] : []);
    if (user.servicePackages?.length) {
      setPackageRows(
        user.servicePackages.map((r) => ({
          ...r,
          price: vndDigitsOnly(r.price ?? ""),
        })),
      );
    } else if (user.pricing?.trim()) {
      setPackageRows([{ name: "", price: "", detail: user.pricing }]);
    } else {
      setPackageRows([{ name: "", price: "", detail: "" }]);
    }
    setIsPublicProfile(user.isPublicProfile);
  }, [user]);

  if (!user) return null;

  function updatePackageRow(index: number, field: keyof ServicePackageRow, value: string) {
    setPackageRows((rows) =>
      rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  }

  function addPackageRow() {
    setPackageRows((rows) => [...rows, { name: "", price: "", detail: "" }]);
  }

  function removePackageRow(index: number) {
    setPackageRows((rows) => {
      if (rows.length <= 1) {
        return [{ name: "", price: "", detail: "" }];
      }
      return rows.filter((_, i) => i !== index);
    });
  }

  async function handleAvatarFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarProcessing(true);
    setNotice(null);
    try {
      const dataUrl = await processAvatarImageFile(file);
      setAvatarUrl(dataUrl);
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      const messageKey =
        code === "invalidType"
          ? "account.avatarErrorInvalid"
          : code === "tooLarge"
            ? "account.avatarErrorTooLarge"
            : "account.avatarErrorGeneric";
      setNotice({ type: "error", message: t(messageKey) });
    } finally {
      setAvatarProcessing(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);

    const trimmedPhone = phone.trim();
    if (!/^[0-9+\s-]{9,15}$/.test(trimmedPhone)) {
      setLoading(false);
      setNotice({ type: "error", message: t("account.phoneInvalid") });
      return;
    }

    const emailTrimmed = email.trim();
    if (
      emailTrimmed &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)
    ) {
      setLoading(false);
      setNotice({ type: "error", message: t("account.emailInvalid") });
      return;
    }

    const locationLine = districtKeysToDisplayLine(language, districtKeys);
    const geoQuery = districtKeysToGeocodeQuery(districtKeys).trim();
    let latitude: number | undefined;
    let longitude: number | undefined;
    if (geoQuery) {
      try {
        const geoRes = await fetch(`/api/geocode/forward?q=${encodeURIComponent(geoQuery)}`);
        const geo = (await geoRes.json()) as { lat?: unknown; lng?: unknown };
        if (geoRes.ok && typeof geo.lat === "number" && typeof geo.lng === "number") {
          latitude = geo.lat;
          longitude = geo.lng;
        }
      } catch {
        /* leave coords cleared when geocoding fails */
      }
    }

    const packagesNorm = normalizeServicePackages(packageRows);
    const pricingSummary =
      packagesNorm.length > 0 ? servicePackagesToSummary(packagesNorm) : "";

    const dn = displayName.trim();

    const result = await updateProfile({
      displayName: dn || undefined,
      phoneNumber: trimmedPhone,
      email: emailTrimmed ? emailTrimmed.toLowerCase() : undefined,
      studioAddress: studioAddress.trim() || undefined,
      bio,
      location: locationLine || undefined,
      serviceAreaDistrictKeys: districtKeys,
      avatarUrl,
      specialties: styleTags,
      cosmeticBrands: brandTags,
      servicePackages: packagesNorm,
      pricing: pricingSummary || undefined,
      isPublicProfile,
      latitude,
      longitude,
    });
    setLoading(false);
    setNotice({ type: result.ok ? "success" : "error", message: t(result.messageKey) });
  }

  return (
    <main className="min-h-screen bg-[#fdf8f6] p-4 sm:p-6">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-black">{t("account.title")}</h1>
            <p className="text-sm text-gray-600">
              {t("account.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AppButton variant="secondary" onClick={() => router.push("/")}>
              {t("account.navHome")}
            </AppButton>
            <AppButton variant="secondary" onClick={() => router.push("/dashboard")}>
              {t("account.navPersonalPage")}
            </AppButton>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">
              {t("account.avatarPhoto")}
            </span>
            <label
              htmlFor="account-avatar-file"
              className={`group flex flex-wrap items-center gap-4 rounded-2xl border border-black/10 bg-white px-4 py-3 transition ${
                avatarProcessing
                  ? "cursor-wait opacity-60"
                  : "cursor-pointer hover:border-black/20 hover:bg-gray-50/80"
              }`}
            >
              <input
                id="account-avatar-file"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarFileChange}
                disabled={avatarProcessing}
              />
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="pointer-events-none h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-black/10"
                />
              ) : (
                <div
                  className="pointer-events-none flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-xs text-gray-400"
                  aria-hidden
                >
                  —
                </div>
              )}
              <span className="pointer-events-none rounded-full border border-black/20 bg-white px-6 py-3 text-sm font-semibold text-black transition group-hover:bg-black group-hover:text-white">
                {avatarProcessing ? t("account.avatarProcessing") : t("account.avatarChooseFile")}
              </span>
            </label>
            <p className="mt-1.5 text-xs text-gray-500">{t("account.avatarPhotoHint")}</p>
          </div>

          <div>
            <AppInput label={t("account.displayName")} value={displayName} onChange={setDisplayName} />
            <p className="mt-1.5 text-xs text-gray-500">{t("account.displayNameHint")}</p>
          </div>

          <div>
            <AppInput
              label={t("account.phoneLabel")}
              type="tel"
              value={phone}
              onChange={setPhone}
            />
            <p className="mt-1.5 text-xs text-gray-500">{t("account.phoneHint")}</p>
          </div>

          <div>
            <AppInput
              label={t("account.emailLabel")}
              type="email"
              value={email}
              onChange={setEmail}
            />
            <p className="mt-1.5 text-xs text-gray-500">{t("account.emailHint")}</p>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">
              {t("account.studioAddress")}
            </span>
            <textarea
              value={studioAddress}
              onChange={(e) => setStudioAddress(e.target.value)}
              rows={2}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
            />
            <p className="mt-1.5 text-xs text-gray-500">{t("account.studioAddressHint")}</p>
          </label>

          <HcmDistrictMultiSelect
            label={t("account.serviceArea")}
            hint={t("account.serviceAreaHint")}
            placeholder={t("account.serviceAreaPlaceholder")}
            language={language}
            selectedKeys={districtKeys}
            onChange={setDistrictKeys}
          />
          <p className="text-xs text-gray-500">{t("account.locationDistanceHint")}</p>

          <SuggestTagsField
            label={t("account.styleSpecialty")}
            hint={t("account.styleSpecialtyHint")}
            placeholder={t("account.styleSpecialtyPlaceholder")}
            values={styleTags}
            onChange={setStyleTags}
            suggestions={styleSuggestions}
          />

          <div className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">
              {t("account.servicePackagesSection")}
            </span>
            <div className="overflow-x-auto rounded-2xl border border-black/10">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/10 bg-black/[0.02] text-left">
                    <th className="px-3 py-2.5 font-medium text-gray-700">
                      {t("account.packageColName")}
                    </th>
                    <th className="w-[140px] px-3 py-2.5 font-medium text-gray-700">
                      {t("account.packageColPrice")}
                    </th>
                    <th className="min-w-[180px] px-3 py-2.5 font-medium text-gray-700">
                      {t("account.packageColDetail")}
                    </th>
                    <th className="w-12 px-1" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {packageRows.map((row, i) => (
                    <tr key={i} className="border-b border-black/5 last:border-0">
                      <td className="px-2 py-2 align-top">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => updatePackageRow(i, "name", e.target.value)}
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            value={formatVndDots(row.price)}
                            onChange={(e) =>
                              updatePackageRow(i, "price", vndDigitsOnly(e.target.value))
                            }
                            className="w-full rounded-xl border border-black/10 bg-white py-2 pl-3 pr-9 text-sm tabular-nums outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                            aria-label={t("account.packageColPrice")}
                          />
                          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 select-none text-xs font-medium text-gray-400">
                            ₫
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <input
                          type="text"
                          value={row.detail}
                          onChange={(e) => updatePackageRow(i, "detail", e.target.value)}
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                        />
                      </td>
                      <td className="px-1 py-2 align-top text-center">
                        <button
                          type="button"
                          className="rounded-lg px-2 py-1 text-lg leading-none text-gray-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={t("account.removePackageRow")}
                          onClick={() => removePackageRow(i)}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AppButton type="button" variant="secondary" className="mt-2" onClick={addPackageRow}>
              {t("account.addPackageRow")}
            </AppButton>
          </div>

          <SuggestTagsField
            label={t("account.cosmeticBrands")}
            hint={t("account.cosmeticBrandsHint")}
            placeholder={t("account.cosmeticBrandsPlaceholder")}
            values={brandTags}
            onChange={setBrandTags}
            suggestions={COSMETIC_BRAND_SUGGESTIONS}
          />

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">{t("account.bio")}</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-black/10 p-4">
            <input
              type="checkbox"
              checked={isPublicProfile}
              onChange={(e) => setIsPublicProfile(e.target.checked)}
            />
            <span className="text-sm text-gray-700">{t("account.profilePublic")}</span>
          </label>

          {notice ? <Notice type={notice.type} message={notice.message} /> : null}

          <AppButton type="submit" loading={loading}>
            {t("common.saveChanges")}
          </AppButton>
        </form>
      </div>
    </main>
  );
}
