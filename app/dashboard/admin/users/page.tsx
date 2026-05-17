import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminUsersManager } from "@/components/admin/admin-users-manager";
import { fetchAdminUsersList } from "@/lib/admin/fetch-admin-users";
import { AppRoutes } from "@/lib/app-routes";
import { createRouteSupabase } from "@/lib/supabase/create-route-supabase";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    role?: string;
    page?: string;
  }>;
};

async function AdminUsersPageContent({ searchParams }: PageProps) {
  const supabase = await createRouteSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(AppRoutes.dashboard);
  const authUserId = user.id;
  const params = await searchParams;

  const page = Math.max(1, Number(params.page) || 1);
  const result = await fetchAdminUsersList(supabase, {
    q: params.q,
    role: params.role ?? "all",
    page,
  });

  return (
    <AdminUsersManager
      rows={result.rows}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
      initialQuery={params.q ?? ""}
      initialRole={params.role ?? "all"}
      fetchError={result.error}
      authUserId={authUserId}
    />
  );
}

export default function AdminUsersPage(props: PageProps) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading users…</div>}>
      <AdminUsersPageContent {...props} />
    </Suspense>
  );
}
