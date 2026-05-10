"use client";

import { RoleGate } from "@/components/auth/role-gate";
import { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <RoleGate>{children}</RoleGate>;
}
