"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { getUserByUsername } from "@/lib/auth-storage";
import { UserAccount } from "@/lib/auth-types";
import { ROLE_META } from "@/lib/role-meta";

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserAccount | null>(null);

  useEffect(() => {
    if (!params.username) return;
    const user = getUserByUsername(params.username);
    setProfile(user);
  }, [params.username]);

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fdf8f6] p-6">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-black">Profile not found</p>
          <Link className="mt-4 inline-block text-pink-500 hover:underline" href="/">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  if (!profile.isPublicProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fdf8f6] p-6">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-black">This profile is private</p>
          <Link className="mt-4 inline-block text-pink-500 hover:underline" href="/">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fdf8f6] p-4 sm:p-6">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-pink-500">Public Profile</p>
            <h1 className="text-3xl font-bold text-black">{profile.username}</h1>
            <p className="text-sm text-gray-600">{ROLE_META[profile.role].label}</p>
          </div>
          <Link href="/auth/login">
            <AppButton variant="secondary">Login to Connect</AppButton>
          </Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-black/10 p-5">
            <p className="text-sm text-gray-500">Location</p>
            <p className="mt-1 font-medium text-black">{profile.location || "Updating soon"}</p>
          </div>
          <div className="rounded-3xl border border-black/10 p-5">
            <p className="text-sm text-gray-500">Pricing / Services</p>
            <p className="mt-1 font-medium text-black">{profile.pricing || "Contact for quote"}</p>
          </div>
          <div className="rounded-3xl border border-black/10 p-5">
            <p className="text-sm text-gray-500">Rating</p>
            <p className="mt-1 font-medium text-black">
              {profile.rating ? `${profile.rating} ★ (${profile.reviews ?? 0} reviews)` : "No reviews yet"}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-black/10 p-6">
          <h2 className="text-lg font-semibold text-black">Bio</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {profile.bio || "This profile is being polished with new information."}
          </p>
        </div>
      </div>
    </main>
  );
}
