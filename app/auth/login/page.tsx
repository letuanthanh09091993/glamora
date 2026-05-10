"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { Notice } from "@/components/ui/notice";
import { useAuth } from "@/components/providers/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { login, refreshUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    const result = await login(username, password);
    setLoading(false);
    setNotice({ type: result.ok ? "success" : "error", message: result.message });

    if (result.ok) {
      refreshUser();
      setTimeout(() => router.push("/dashboard"), 500);
    }
  }

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Log in and continue managing your beauty marketplace journey."
      footerText="New to Glamora?"
      footerLink="/auth/signup"
      footerLabel="Create account"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AppInput
          label="Username"
          value={username}
          onChange={setUsername}
          placeholder="yourname"
        />
        <AppInput
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Your secure password"
        />
        {notice ? <Notice type={notice.type} message={notice.message} /> : null}
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-sm text-gray-500 hover:text-black">
            Back to Home
          </Link>
          <AppButton type="submit" loading={loading}>
            Login
          </AppButton>
        </div>
      </form>
    </AuthShell>
  );
}
