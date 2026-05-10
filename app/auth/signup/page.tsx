"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RoleCard } from "@/components/auth/role-card";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { Notice } from "@/components/ui/notice";
import { UserRole } from "@/lib/auth-types";
import { ROLE_META } from "@/lib/role-meta";
import { useAuth } from "@/components/providers/auth-provider";

type FormState = {
  username: string;
  password: string;
  phoneNumber: string;
  role: UserRole;
};

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [form, setForm] = useState<FormState>({
    username: "",
    password: "",
    phoneNumber: "",
    role: "customer",
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  const errors = useMemo(() => {
    return {
      username:
        form.username.trim().length < 3 ? "Username must be at least 3 characters." : "",
      password:
        form.password.trim().length < 6 ? "Password must be at least 6 characters." : "",
      phoneNumber:
        !/^[0-9+\s-]{9,15}$/.test(form.phoneNumber.trim())
          ? "Phone number format is invalid."
          : "",
    };
  }, [form]);

  const hasError = Boolean(errors.username || errors.password || errors.phoneNumber);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (hasError) {
      setNotice({ type: "error", message: "Please fix validation errors first." });
      return;
    }

    setLoading(true);
    setNotice(null);
    const result = await signUp(form);
    setLoading(false);
    setNotice({ type: result.ok ? "success" : "error", message: result.message });

    if (result.ok) {
      setTimeout(() => router.push(ROLE_META[form.role].dashboardPath), 600);
    }
  }

  return (
    <AuthShell
      title="Create Your Account"
      subtitle="Start your Glamora journey with a tailored role-based experience."
      footerText="Already have an account?"
      footerLink="/auth/login"
      footerLabel="Login"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AppInput
          label="Username"
          value={form.username}
          onChange={(value) => setForm((prev) => ({ ...prev, username: value }))}
          placeholder="yourname"
          error={errors.username}
        />
        <AppInput
          label="Password"
          type="password"
          value={form.password}
          onChange={(value) => setForm((prev) => ({ ...prev, password: value }))}
          placeholder="At least 6 characters"
          error={errors.password}
        />
        <AppInput
          label="Phone Number"
          value={form.phoneNumber}
          onChange={(value) => setForm((prev) => ({ ...prev, phoneNumber: value }))}
          placeholder="+84..."
          error={errors.phoneNumber}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Select your role</p>
          <div className="grid gap-3">
            {(Object.keys(ROLE_META) as UserRole[]).map((role) => (
              <RoleCard
                key={role}
                role={role}
                title={ROLE_META[role].label}
                description={ROLE_META[role].description}
                active={form.role === role}
                onSelect={(selected) => setForm((prev) => ({ ...prev, role: selected }))}
              />
            ))}
          </div>
        </div>

        {notice ? <Notice type={notice.type} message={notice.message} /> : null}

        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-sm text-gray-500 hover:text-black">
            Back to Home
          </Link>
          <AppButton type="submit" loading={loading}>
            Create Account
          </AppButton>
        </div>
      </form>
    </AuthShell>
  );
}
