"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { Notice } from "@/components/ui/notice";
import { useAuth } from "@/components/providers/auth-provider";
import { RoleGate } from "@/components/auth/role-gate";

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
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [pricing, setPricing] = useState("");
  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setBio(user.bio ?? "");
    setLocation(user.location ?? "");
    setAvatarUrl(user.avatarUrl ?? "");
    setSpecialties((user.specialties ?? []).join(", "));
    setPricing(user.pricing ?? "");
    setIsPublicProfile(user.isPublicProfile);
  }, [user]);

  if (!user) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    const result = await updateProfile({
      bio,
      location,
      avatarUrl,
      pricing,
      specialties: specialties
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      isPublicProfile,
    });
    setLoading(false);
    setNotice({ type: result.ok ? "success" : "error", message: result.message });
  }

  return (
    <main className="min-h-screen bg-[#fdf8f6] p-4 sm:p-6">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-black">Profile Settings</h1>
            <p className="text-sm text-gray-600">
              Edit your profile, manage visibility, and keep your presence premium.
            </p>
          </div>
          <AppButton variant="secondary" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </AppButton>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <AppInput label="Avatar URL" value={avatarUrl} onChange={setAvatarUrl} />
          <AppInput label="Location" value={location} onChange={setLocation} />
          <AppInput
            label="Specialties (comma separated)"
            value={specialties}
            onChange={setSpecialties}
          />
          <AppInput label="Pricing / Services" value={pricing} onChange={setPricing} />

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Bio / Introduction</span>
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
            <span className="text-sm text-gray-700">Make my profile public</span>
          </label>

          {notice ? <Notice type={notice.type} message={notice.message} /> : null}

          <AppButton type="submit" loading={loading}>
            Save Changes
          </AppButton>
        </form>
      </div>
    </main>
  );
}
